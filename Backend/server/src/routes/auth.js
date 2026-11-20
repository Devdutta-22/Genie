/**
 * ============================================================================
 * AUTH ROUTER (Prisma 8 / Supabase Auth & PostgreSQL Integration)
 * ============================================================================
 * 
 * PostgreSQL & Supabase Auth Architecture:
 * 1. Supabase Auth (`auth.users`):
 *    - Stores authentication credentials, encrypted passwords, and user metadata.
 * 2. Database Trigger (`core.handle_new_user`):
 *    - An automated PostgreSQL trigger on `auth.users` listens for new user
 *      registrations and automatically inserts the corresponding application
 *      record into `core.users`.
 * 3. Application Profile (`core.user_profiles`):
 *    - Holds extended campus student details: full_name, username, bio,
 *      avatar_url, department, course, year_of_study.
 * 4. Skills (`core.skills` & `core.user_skills`):
 *    - Many-to-many relationship linking student accounts to marketplace skills.
 * ============================================================================
 */

import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { db, pgPool } from '../db.js';

export const authRouter = express.Router();
export const JWT_SECRET = process.env.JWT_SECRET || 'gully_gigs_campus_secret_key_2026';

// Configure Multer storage for student ID cards
const uploadsDir = path.resolve('server/uploads/id_cards');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    cb(null, `idcard-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|pdf/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only JPG, PNG, WEBP and PDF files are allowed for ID card upload'));
  }
});

/**
 * Formats a sanitized user object with profile details and skills
 * for client-facing API responses.
 */
async function assembleUserResponse(userId) {
  const user = await db.orm.core.User.where({ id: userId }).first();
  if (!user) return null;

  const profile = await db.orm.core.UserProfile.where({ userId }).first();
  const userSkills = await db.orm.core.UserSkill.where({ userId }).all();
  const skillsCatalog = await db.orm.core.Skill.all();
  const skillMap = new Map(skillsCatalog.map((s) => [s.id, s.name]));

  const skills = userSkills.map((us) => ({
    skill: skillMap.get(us.skillId) || 'Skill',
    level: us.proficiencyLevel >= 4 ? 'Advanced' : 'Intermediate',
    proficiencyLevel: us.proficiencyLevel
  }));

  const ratingAvg = profile?.ratingAverage !== null && profile?.ratingAverage !== undefined
    ? parseFloat(profile.ratingAverage)
    : 5.0;

  return {
    id: user.id,
    name: profile?.fullName || user.email.split('@')[0],
    fullName: profile?.fullName || user.email.split('@')[0],
    email: user.email,
    avatar: profile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile?.fullName || user.email)}`,
    avatarUrl: profile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile?.fullName || user.email)}`,
    college: 'Galgotias University (GU)',
    course: profile?.course || 'B.Tech',
    year: profile?.yearOfStudy ? `${profile.yearOfStudy}th Year` : '1st Year',
    department: profile?.department || 'Computer Science',
    location_name: 'Campus Center',
    latitude: 28.3664,
    longitude: 77.5404,
    rating: ratingAvg,
    rating_count: 0,
    completed_gigs: profile?.totalGigsCompleted || 0,
    completion_rate: 1.0,
    response_rate: 1.0,
    availability: 'Available Now',
    is_active: user.isActive ? 1 : 0,
    bio: profile?.bio || '',
    student_id: user.universityId,
    verification_status: user.verificationStatus,
    role: user.role,
    skills
  };
}

// ============================================================================
// POST /api/auth/register - Register a new campus student
// ============================================================================
authRouter.post('/register', upload.single('id_card'), async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      student_id,
      college,
      course,
      year,
      department,
      location_name,
      latitude,
      longitude,
      bio,
      skills
    } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (!student_id) {
      return res.status(400).json({ error: 'Student Roll / Registration ID is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists in core.users
    const existingUser = await db.orm.core.User.where({ email: cleanEmail }).first();
    if (existingUser) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
    }

    // Hash password with bcrypt
    const password_hash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    const cleanStudentId = student_id.trim();

    // 1. Provision user in auth.users
    // The PostgreSQL trigger `core.handle_new_user()` automatically executes
    // and creates the corresponding row in `core.users`.
    await pgPool.query(`
      INSERT INTO auth.users (
        id, email, encrypted_password, email_confirmed_at,
        raw_user_meta_data, role, aud, created_at, updated_at
      ) VALUES (
        $1, $2, $3, NOW(),
        $4, 'authenticated', 'authenticated', NOW(), NOW()
      )
    `, [
      userId,
      cleanEmail,
      password_hash,
      JSON.stringify({
        university_id: cleanStudentId,
        name: name.trim(),
        role: 'STUDENT'
      })
    ]);

    // 2. Create student profile in core.user_profiles
    const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=0284c7,0d9488,4f46e5`;
    const yearNumber = year ? parseInt(year, 10) || 1 : 1;

    await db.orm.core.UserProfile.create({
      userId,
      fullName: name.trim(),
      username: `${cleanEmail.split('@')[0]}_${Math.random().toString(36).substring(2, 6)}`,
      bio: bio || 'Campus micro-gig contributor',
      avatarUrl: defaultAvatar,
      department: department || 'Computer Science',
      course: course || 'B.Tech',
      yearOfStudy: yearNumber,
      ratingAverage: 5.0,
      totalGigsCompleted: 0,
      totalGigsPosted: 0,
    });

    // 3. Process and associate user skills
    let skillsList = [];
    if (skills) {
      try {
        skillsList = typeof skills === 'string' ? JSON.parse(skills) : skills;
      } catch (e) {
        skillsList = Array.isArray(skills) ? skills : [skills];
      }

      for (const s of skillsList) {
        const skillName = typeof s === 'string' ? s.trim() : (s.skill || s.name || '').trim();
        const skillLevel = typeof s === 'object' && s.level ? s.level : 'Intermediate';
        if (skillName) {
          // Find or create in master skills catalog
          let skillRecord = await db.orm.core.Skill.where({ name: skillName }).first();
          if (!skillRecord) {
            skillRecord = await db.orm.core.Skill.create({
              name: skillName,
              category: 'General',
              description: `Skill: ${skillName}`
            });
          }

          // Link to user in core.user_skills
          try {
            await db.orm.core.UserSkill.create({
              userId,
              skillId: skillRecord.id,
              proficiencyLevel: skillLevel === 'Advanced' ? 4 : 3,
              isPrimary: false
            });
          } catch (skillLinkErr) {
            // Skill already linked; ignore unique constraint collision
          }
        }
      }
    }

    const user = await assembleUserResponse(userId);

    // Sign JWT authentication token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully! ID card submitted for campus verification.',
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Server error during registration' });
  }
});

// ============================================================================
// POST /api/auth/login - Log in with student email and password
// ============================================================================
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Verify user exists in core.users
    const user = await db.orm.core.User.where({ email: cleanEmail }).first();
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 2. Retrieve password hash from auth.users
    const authResult = await pgPool.query(
      'SELECT encrypted_password FROM auth.users WHERE id = $1',
      [user.id]
    );

    if (authResult.rows.length === 0 || !authResult.rows[0].encrypted_password) {
      return res.status(401).json({ error: 'Account credentials not found. Please contact administrator.' });
    }

    // 3. Verify password hash using bcrypt
    const isMatch = await bcrypt.compare(password, authResult.rows[0].encrypted_password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update lastLoginAt
    await db.orm.core.User.where({ id: user.id }).update({
      lastLoginAt: new Date(),
    });

    const userResponse = await assembleUserResponse(user.id);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Logged in successfully',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Server error during login' });
  }
});

// ============================================================================
// GET /api/auth/me - Retrieve authenticated session details
// ============================================================================
authRouter.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await assembleUserResponse(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User no longer exists' });
    }

    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// ============================================================================
// GET /api/auth/demo-users - Quick demo logins for faculty / examiners
// ============================================================================
authRouter.get('/demo-users', async (req, res) => {
  try {
    const users = await db.orm.core.User.all();

    // If no users exist, automatically seed demo student accounts
    if (users.length === 0) {
      await seedDemoStudents();
    }

    const allUsers = await db.orm.core.User.all();
    const profiles = await db.orm.core.UserProfile.all();
    const profileMap = new Map(profiles.map((p) => [p.userId, p]));

    const demoUsers = allUsers.slice(0, 6).map((u) => {
      const p = profileMap.get(u.id);
      return {
        id: u.id,
        name: p?.fullName || u.email.split('@')[0],
        email: u.email,
        avatar: p?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p?.fullName || u.email)}`,
        college: 'Galgotias University (GU)',
        course: p?.course || 'B.Tech',
        department: p?.department || 'Computer Science',
        verification_status: u.verificationStatus
      };
    });

    res.json(demoUsers);
  } catch (error) {
    console.error('Error in demo-users:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Seeds demo student users for viva / testing if the database is initially empty.
 */
async function seedDemoStudents() {
  const demoData = [
    {
      name: 'Aarav Sharma',
      email: 'aarav.sharma@galgotiasuniversity.edu.in',
      studentId: 'GU2023-CS-101',
      course: 'B.Tech Computer Science',
      department: 'Computer Science & Engineering',
      year: 3,
      bio: 'Full-stack developer & Python enthusiast. Available for web dev & coding gigs.',
      skills: ['Python', 'React', 'JavaScript', 'DBMS']
    },
    {
      name: 'Priya Patel',
      email: 'priya.patel@galgotiasuniversity.edu.in',
      studentId: 'GU2024-DS-204',
      course: 'B.Des Graphic Design',
      department: 'School of Design',
      year: 2,
      bio: 'Canva & Figma specialist. Poster designer for campus clubs and fest events.',
      skills: ['Canva', 'Figma', 'Poster Design', 'Photoshop']
    },
    {
      name: 'Rohan Verma',
      email: 'rohan.verma@galgotiasuniversity.edu.in',
      studentId: 'GU2023-MG-305',
      course: 'BBA Logistics & Supply Chain',
      department: 'School of Business',
      year: 3,
      bio: 'Quick on my feet. Available for urgent document deliveries and stall logistics.',
      skills: ['Delivery', 'Campus Navigation', 'Event Logistics']
    },
    {
      name: 'Neha Gupta',
      email: 'neha.gupta@galgotiasuniversity.edu.in',
      studentId: 'GU2024-CA-112',
      course: 'BCA Cloud Computing',
      department: 'Computer Applications',
      year: 2,
      bio: 'Study notes creator and PPT deck designer. Helping peers ace examinations.',
      skills: ['PPT Presentation', 'Study Notes', 'Tutoring']
    }
  ];

  for (const student of demoData) {
    try {
      const userId = crypto.randomUUID();
      const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

      // 1. Insert into auth.users (trigger handle_new_user creates core.users)
      await pgPool.query(`
        INSERT INTO auth.users (
          id, email, encrypted_password, email_confirmed_at,
          raw_user_meta_data, role, aud, created_at, updated_at
        ) VALUES (
          $1, $2, $3, NOW(),
          $4, 'authenticated', 'authenticated', NOW(), NOW()
        )
      `, [
        userId,
        student.email,
        defaultPasswordHash,
        JSON.stringify({
          university_id: student.studentId,
          name: student.name,
          role: 'STUDENT'
        })
      ]);

      // 2. Create user profile in core.user_profiles
      const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.name)}&backgroundColor=0284c7,0d9488,4f46e5`;
      await db.orm.core.UserProfile.create({
        userId,
        fullName: student.name,
        username: student.email.split('@')[0],
        bio: student.bio,
        avatarUrl: avatar,
        department: student.department,
        course: student.course,
        yearOfStudy: student.year,
        ratingAverage: 5.0,
        totalGigsCompleted: 2,
        totalGigsPosted: 1
      });

      // 3. Link skills
      for (const skillName of student.skills) {
        let skillRecord = await db.orm.core.Skill.where({ name: skillName }).first();
        if (!skillRecord) {
          skillRecord = await db.orm.core.Skill.create({
            name: skillName,
            category: 'General',
            description: `Skill: ${skillName}`
          });
        }

        try {
          await db.orm.core.UserSkill.create({
            userId,
            skillId: skillRecord.id,
            proficiencyLevel: 4,
            isPrimary: true
          });
        } catch (e) {}
      }
    } catch (err) {
      console.warn(`Could not seed demo user ${student.email}:`, err.message);
    }
  }
}
