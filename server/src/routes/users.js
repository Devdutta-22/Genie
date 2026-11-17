import express from 'express';
import { db } from '../db.js';

const Router = express.Router;
export const usersRouter = Router();

// GET all users
usersRouter.get('/', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM users ORDER BY name ASC').all();
    const userSkills = db.prepare('SELECT * FROM user_skills').all();

    const formatted = users.map((u) => {
      const skills = userSkills
        .filter((s) => s.user_id === u.id)
        .map((s) => ({ skill: s.skill_name, level: s.experience_level }));
      return { ...u, skills };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single user profile with ratings
usersRouter.get('/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const skills = db
      .prepare('SELECT skill_name as skill, experience_level as level FROM user_skills WHERE user_id = ?')
      .all(req.params.id);
    const reviews = db
      .prepare(`
        SELECT r.*, u.name as reviewer_name, u.avatar as reviewer_avatar
        FROM ratings r
        JOIN users u ON r.from_user_id = u.id
        WHERE r.to_user_id = ?
        ORDER BY r.created_at DESC
      `)
      .all(req.params.id);

    res.json({
      ...user,
      skills,
      reviews
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user location
usersRouter.put('/:id/location', (req, res) => {
  try {
    const { location_name, latitude, longitude } = req.body;
    db.prepare(`
      UPDATE users
      SET location_name = ?, latitude = ?, longitude = ?
      WHERE id = ?
    `).run(location_name, latitude, longitude, req.params.id);

    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register new student profile
usersRouter.post('/', (req, res) => {
  try {
    const {
      name, email, avatar, college, course, year, department,
      location_name, latitude, longitude, availability, bio, skills
    } = req.body;

    const id = 'usr_' + Date.now();
    db.prepare(`
      INSERT INTO users (
        id, name, email, avatar, college, course, year, department,
        location_name, latitude, longitude, rating, rating_count,
        completed_gigs, completion_rate, response_rate, availability, is_active, bio
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 5.0, 0, 0, 1.0, 1.0, ?, 1, ?)
    `).run(
      id, name, email, avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      college || 'Delhi Technological Campus (DTC)', course, year, department,
      location_name || 'Block B', latitude || 28.5448, longitude || 77.1935,
      availability || 'Available Now', bio || ''
    );

    if (Array.isArray(skills)) {
      const insertSkill = db.prepare('INSERT INTO user_skills (user_id, skill_name, experience_level) VALUES (?, ?, ?)');
      for (const s of skills) {
        insertSkill.run(id, typeof s === 'string' ? s : s.name, s.level || 'Intermediate');
      }
    }

    const created = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
