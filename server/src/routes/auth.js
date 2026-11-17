import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';

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

// Helper to format user response safely (strips password_hash)
function sanitizeUser(user) {
  const { password_hash, ...safeUser } = user;
  const skills = db
    .prepare('SELECT skill_name as skill, experience_level as level FROM user_skills WHERE user_id = ?')
    .all(user.id);
  return {
    ...safeUser,
    skills
  };
}

// POST /api/auth/register - Register a new campus student with ID card upload
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

    if (!req.file) {
      return res.status(400).json({ error: 'Please upload your College ID Card for verification.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (existingUser) {
      // Remove uploaded file if user already exists
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
    }

    // Hash password with bcrypt
    const password_hash = await bcrypt.hash(password, 10);

    const id = 'usr_' + Date.now();
    const id_card_url = `/uploads/id_cards/${req.file.filename}`;
    const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0284c7,0d9488,4f46e5`;

    const lat = latitude ? parseFloat(latitude) : 28.3664;
    const lon = longitude ? parseFloat(longitude) : 77.5404;

    db.prepare(`
      INSERT INTO users (
        id, name, email, avatar, college, course, year, department,
        location_name, latitude, longitude, rating, rating_count,
        completed_gigs, completion_rate, response_rate, availability, is_active, bio,
        password_hash, student_id, id_card_url, verification_status, role, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, 5.0, 0,
        0, 1.0, 1.0, 'Available Now', 1, ?,
        ?, ?, ?, 'PENDING', 'STUDENT', ?
      )
    `).run(
      id,
      name.trim(),
      cleanEmail,
      defaultAvatar,
      college || 'Galgotias University (GU)',
      course || 'B.Tech',
      year || '1st Year',
      department || 'Computer Science',
      location_name || 'Galgotias Campus',
      lat,
      lon,
      bio || 'Campus micro-gig seeker & contributor',
      password_hash,
      student_id.trim(),
      id_card_url,
      new Date().toISOString()
    );

    // Insert user skills if provided
    let skillsList = [];
    if (skills) {
      try {
        skillsList = typeof skills === 'string' ? JSON.parse(skills) : skills;
      } catch (e) {
        skillsList = Array.isArray(skills) ? skills : [skills];
      }

      const insertSkill = db.prepare('INSERT OR IGNORE INTO user_skills (user_id, skill_name, experience_level) VALUES (?, ?, ?)');
      for (const s of skillsList) {
        const skillName = typeof s === 'string' ? s.trim() : (s.skill || s.name || '').trim();
        const skillLevel = typeof s === 'object' && s.level ? s.level : 'Intermediate';
        if (skillName) {
          insertSkill.run(id, skillName, skillLevel);
        }
      }
    }

    const createdRaw = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    const user = sanitizeUser(createdRaw);

    // Sign JWT
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

// POST /api/auth/login - Log in with email and password
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userRaw = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(cleanEmail);

    if (!userRaw) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!userRaw.password_hash) {
      return res.status(401).json({ error: 'Account has no password set. Please contact administrator.' });
    }

    const isMatch = await bcrypt.compare(password, userRaw.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = sanitizeUser(userRaw);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Logged in successfully',
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Server error during login' });
  }
});

// GET /api/auth/me - Get current logged-in user details from JWT token
authRouter.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const userRaw = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!userRaw) {
      return res.status(404).json({ error: 'User no longer exists' });
    }

    const user = sanitizeUser(userRaw);
    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// GET /api/auth/demo-users - Quick demo logins for faculty / examiners during viva
authRouter.get('/demo-users', (req, res) => {
  try {
    const seedUsers = db.prepare(`
      SELECT id, name, email, avatar, college, course, department, verification_status 
      FROM users 
      LIMIT 6
    `).all();
    res.json(seedUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
