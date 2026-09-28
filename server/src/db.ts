import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const dataDir = path.resolve('server/data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'gullygigs.db');
export const db = new DatabaseSync(dbPath);

// Enable WAL mode for high concurrency
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      avatar TEXT,
      college TEXT NOT NULL,
      course TEXT NOT NULL,
      year TEXT NOT NULL,
      department TEXT NOT NULL,
      location_name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      rating REAL DEFAULT 5.0,
      rating_count INTEGER DEFAULT 0,
      completed_gigs INTEGER DEFAULT 0,
      completion_rate REAL DEFAULT 1.0,
      response_rate REAL DEFAULT 0.95,
      availability TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      bio TEXT
    );

    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_skills (
      user_id TEXT NOT NULL,
      skill_name TEXT NOT NULL,
      experience_level TEXT DEFAULT 'Intermediate',
      PRIMARY KEY (user_id, skill_name),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS gigs (
      id TEXT PRIMARY KEY,
      poster_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      budget INTEGER NOT NULL,
      platform_fee INTEGER NOT NULL,
      worker_payout INTEGER NOT NULL,
      location_name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      deadline TEXT NOT NULL,
      urgency TEXT DEFAULT 'Normal',
      status TEXT DEFAULT 'ACTIVE',
      assigned_worker_id TEXT,
      submission_notes TEXT,
      submission_link TEXT,
      created_at TEXT NOT NULL,
      assigned_at TEXT,
      completed_at TEXT,
      FOREIGN KEY (poster_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS gig_skills (
      gig_id TEXT NOT NULL,
      skill_name TEXT NOT NULL,
      PRIMARY KEY (gig_id, skill_name),
      FOREIGN KEY (gig_id) REFERENCES gigs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      gig_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      wave INTEGER DEFAULT 1,
      distance_meters REAL NOT NULL,
      match_score REAL NOT NULL,
      status TEXT DEFAULT 'UNREAD',
      created_at TEXT NOT NULL,
      FOREIGN KEY (gig_id) REFERENCES gigs(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      gig_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (gig_id) REFERENCES gigs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      gig_id TEXT NOT NULL,
      from_user_id TEXT NOT NULL,
      to_user_id TEXT NOT NULL,
      rating INTEGER NOT NULL,
      communication_rating INTEGER NOT NULL,
      quality_rating INTEGER NOT NULL,
      reliability_rating INTEGER NOT NULL,
      review TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (gig_id) REFERENCES gigs(id) ON DELETE CASCADE
    );
  `);

  // Seed default data if users table is empty
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const countRow = countStmt.get() as { count: number };
  if (countRow.count === 0) {
    seedInitialData();
  }
}

function seedInitialData() {
  const insertUser = db.prepare(`
    INSERT INTO users (
      id, name, email, avatar, college, course, year, department,
      location_name, latitude, longitude, rating, rating_count,
      completed_gigs, completion_rate, response_rate, availability, is_active, bio
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const users = [
    {
      id: 'usr_aman',
      name: 'Aman Verma',
      email: 'aman.verma@campus.edu',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      college: 'Delhi Technological Campus (DTC)',
      course: 'B.Tech Mechanical',
      year: '3rd Year',
      department: 'Mechanical Engineering',
      location_name: 'Hostel 4 (Block D)',
      latitude: 28.5420,
      longitude: 77.1905,
      rating: 4.9,
      rating_count: 12,
      completed_gigs: 8,
      completion_rate: 1.0,
      response_rate: 0.98,
      availability: 'Active (Poster)',
      is_active: 1,
      bio: 'Technical Fest Organizer & Club Lead. Frequently posts micro-gigs for events and campus projects.'
    },
    {
      id: 'usr_rahul',
      name: 'Rahul Sharma',
      email: 'rahul.cse@campus.edu',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      college: 'Delhi Technological Campus (DTC)',
      course: 'B.Tech CSE',
      year: '3rd Year',
      department: 'Computer Science',
      location_name: 'Block B (Tech Hub)',
      latitude: 28.5448,
      longitude: 77.1935,
      rating: 4.8,
      rating_count: 17,
      completed_gigs: 17,
      completion_rate: 0.98,
      response_rate: 0.95,
      availability: 'Evenings & Weekends',
      is_active: 1,
      bio: 'Passionate frontend developer, graphic designer (Canva/Photoshop), and Python tutor. Fast and reliable.'
    },
    {
      id: 'usr_priya',
      name: 'Priya Nair',
      email: 'priya.design@campus.edu',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      college: 'Delhi Technological Campus (DTC)',
      course: 'B.Des UI/UX',
      year: '2nd Year',
      department: 'Design & Media',
      location_name: 'Central Library Floor 2',
      latitude: 28.5435,
      longitude: 77.1940,
      rating: 4.9,
      rating_count: 14,
      completed_gigs: 14,
      completion_rate: 1.0,
      response_rate: 0.97,
      availability: 'Available Now',
      is_active: 1,
      bio: 'Visual designer, branding buff, poster creator, and amateur event photographer.'
    },
    {
      id: 'usr_arjun',
      name: 'Arjun Patel',
      email: 'arjun.patel@campus.edu',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      college: 'Delhi Technological Campus (DTC)',
      course: 'B.Tech Electrical',
      year: '4th Year',
      department: 'Electrical Engineering',
      location_name: 'Student Activity Center (SAC)',
      latitude: 28.5440,
      longitude: 77.1918,
      rating: 4.7,
      rating_count: 19,
      completed_gigs: 21,
      completion_rate: 0.95,
      response_rate: 0.92,
      availability: 'Afternoons & Evenings',
      is_active: 1,
      bio: 'Event logistics manager, hardware debugger, stage & stall setup coordinator.'
    },
    {
      id: 'usr_sneha',
      name: 'Sneha Rao',
      email: 'sneha.notes@campus.edu',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      college: 'Delhi Technological Campus (DTC)',
      course: 'MCA',
      year: '1st Year',
      department: 'Computer Applications',
      location_name: 'Block A (Lab 3)',
      latitude: 28.5455,
      longitude: 77.1920,
      rating: 4.9,
      rating_count: 23,
      completed_gigs: 25,
      completion_rate: 1.0,
      response_rate: 0.99,
      availability: 'Weekdays 10 AM - 6 PM',
      is_active: 1,
      bio: 'High scorer in DBMS & OS. Expert in clear study notes, PowerPoint decks, and Python scripting.'
    }
  ];

  for (const u of users) {
    insertUser.run(
      u.id, u.name, u.email, u.avatar, u.college, u.course, u.year, u.department,
      u.location_name, u.latitude, u.longitude, u.rating, u.rating_count,
      u.completed_gigs, u.completion_rate, u.response_rate, u.availability, u.is_active, u.bio
    );
  }

  // Seed user skills
  const insertUserSkill = db.prepare('INSERT INTO user_skills (user_id, skill_name, experience_level) VALUES (?, ?, ?)');
  const skillsData = [
    { user_id: 'usr_rahul', skill: 'Python', level: 'Expert' },
    { user_id: 'usr_rahul', skill: 'React', level: 'Expert' },
    { user_id: 'usr_rahul', skill: 'Photoshop', level: 'Intermediate' },
    { user_id: 'usr_rahul', skill: 'Canva', level: 'Expert' },
    { user_id: 'usr_rahul', skill: 'Video Editing', level: 'Intermediate' },
    { user_id: 'usr_priya', skill: 'Graphic Design', level: 'Expert' },
    { user_id: 'usr_priya', skill: 'Canva', level: 'Expert' },
    { user_id: 'usr_priya', skill: 'Photoshop', level: 'Expert' },
    { user_id: 'usr_priya', skill: 'Photography', level: 'Intermediate' },
    { user_id: 'usr_arjun', skill: 'Stall Setup', level: 'Expert' },
    { user_id: 'usr_arjun', skill: 'Event Logistics', level: 'Expert' },
    { user_id: 'usr_arjun', skill: 'Hardware Debugging', level: 'Intermediate' },
    { user_id: 'usr_sneha', skill: 'DBMS', level: 'Expert' },
    { user_id: 'usr_sneha', skill: 'Python', level: 'Intermediate' },
    { user_id: 'usr_sneha', skill: 'PPT Presentation', level: 'Expert' },
    { user_id: 'usr_sneha', skill: 'Study Notes', level: 'Expert' },
    { user_id: 'usr_aman', skill: 'Event Management', level: 'Intermediate' },
  ];

  for (const s of skillsData) {
    insertUserSkill.run(s.user_id, s.skill, s.level);
  }

  // Seed initial campus gigs
  const insertGig = db.prepare(`
    INSERT INTO gigs (
      id, poster_id, title, description, category, budget, platform_fee, worker_payout,
      location_name, latitude, longitude, deadline, urgency, status,
      assigned_worker_id, submission_notes, submission_link, created_at, assigned_at, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertGigSkill = db.prepare('INSERT INTO gig_skills (gig_id, skill_name) VALUES (?, ?)');

  const initialGigs = [
    {
      id: 'gig_1',
      poster_id: 'usr_aman',
      title: 'Design Instagram Poster for Tech Fest',
      description: 'Need an eye-catching Instagram poster for the upcoming College Annual Hackathon. Modern dark neon tech theme preferred.',
      category: 'Design',
      budget: 300,
      fee: 15,
      payout: 285,
      location_name: 'Block B (Tech Hub)',
      lat: 28.5448,
      lon: 77.1935,
      deadline: 'Tomorrow, 6:00 PM',
      urgency: 'Normal',
      status: 'ACTIVE',
      worker_id: null,
      skills: ['Canva', 'Photoshop', 'Graphic Design']
    },
    {
      id: 'gig_2',
      poster_id: 'usr_aman',
      title: 'Setup Tech Club Stall at Canteen Lawn',
      description: 'Need 1 energetic student to help carry banners and set up tables & audio mic cables for our club registration booth.',
      category: 'Logistics',
      budget: 400,
      fee: 20,
      payout: 380,
      location_name: 'Student Activity Center (SAC)',
      lat: 28.5440,
      lon: 77.1918,
      deadline: 'Today, 4:00 PM',
      urgency: 'Urgent',
      status: 'ACTIVE',
      worker_id: null,
      skills: ['Stall Setup', 'Event Logistics']
    },
    {
      id: 'gig_3',
      poster_id: 'usr_arjun',
      title: 'Handwritten Notes & Summary for DBMS Normalization',
      description: 'Need neat handwritten notes or structured markdown summary covering 1NF, 2NF, 3NF, and BCNF with examples from yesterday lecture.',
      category: 'Academics',
      budget: 250,
      fee: 12,
      payout: 238,
      location_name: 'Central Library Floor 2',
      lat: 28.5435,
      lon: 77.1940,
      deadline: 'Oct 1st, 12:00 PM',
      urgency: 'Normal',
      status: 'ACTIVE',
      worker_id: null,
      skills: ['DBMS', 'Study Notes']
    },
    {
      id: 'gig_4',
      poster_id: 'usr_priya',
      title: 'Deliver Printed Lab Manuals from Block A to Block C',
      description: 'Need someone passing through Block A to pick up 3 bound manual sets from the xerox shop and drop them to Lab 204 in Block C.',
      category: 'Delivery',
      budget: 150,
      fee: 8,
      payout: 142,
      location_name: 'Block A (Xerox Center)',
      lat: 28.5455,
      lon: 77.1920,
      deadline: 'Within 2 hours',
      urgency: 'Urgent',
      status: 'ACTIVE',
      worker_id: null,
      skills: ['Delivery', 'Campus Navigation']
    }
  ];

  const now = new Date().toISOString();
  for (const g of initialGigs) {
    insertGig.run(
      g.id, g.poster_id, g.title, g.description, g.category,
      g.budget, g.fee, g.payout, g.location_name, g.lat, g.lon,
      g.deadline, g.urgency, g.status, g.worker_id, null, null,
      now, null, null
    );
    for (const skill of g.skills) {
      insertGigSkill.run(g.id, skill);
    }
  }

  // Pre-seed a sample completed gig for reputation demonstration
  const completedGigId = 'gig_completed_demo';
  insertGig.run(
    completedGigId, 'usr_aman', 'Create 10-slide Pitch Deck PPT',
    'Created a pitch deck presentation for college startup incubator.',
    'Academics', 350, 18, 332, 'Hostel 4 (Block D)', 28.5420, 77.1905,
    'Yesterday', 'Normal', 'COMPLETED', 'usr_rahul',
    'Delivered Canva presentation link and exported PDF.', 'https://canva.com/design/demo-deck',
    new Date(Date.now() - 86400000 * 2).toISOString(),
    new Date(Date.now() - 86400000).toISOString(),
    now
  );
  insertGigSkill.run(completedGigId, 'PPT Presentation');
  insertGigSkill.run(completedGigId, 'Canva');

  // Insert ratings for completed demo
  const insertRating = db.prepare(`
    INSERT INTO ratings (id, gig_id, from_user_id, to_user_id, rating, communication_rating, quality_rating, reliability_rating, review, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertRating.run('rat_1', completedGigId, 'usr_aman', 'usr_rahul', 5, 5, 5, 5, 'Very fast and delivered the deck ahead of time! High quality slides.', now);

  // Insert sample chat message
  const insertMsg = db.prepare(`
    INSERT INTO messages (id, gig_id, sender_id, receiver_id, message, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertMsg.run('msg_1', completedGigId, 'usr_rahul', 'usr_aman', "Hey Aman, I've shared the draft slides for review!", new Date(Date.now() - 3600000 * 4).toISOString());
  insertMsg.run('msg_2', completedGigId, 'usr_aman', 'usr_rahul', "Looks awesome! Just approve the colors and wrap up.", new Date(Date.now() - 3600000 * 3).toISOString());
}
