import express from 'express';
import type { Request, Response } from 'express';
import { db } from '../db.ts';
import { calculateCandidateMatches, calculateDistanceMeters } from '../matching.ts';
import { extractGigFromNaturalLanguage } from '../aiExtractor.ts';
import { broadcastWsEvent } from '../index.ts';

const Router = express.Router;

export const gigsRouter = Router();

// GET all gigs with user proximity distance
gigsRouter.get('/', (req: Request, res: Response) => {
  try {
    const { category, status, search, userLat, userLon, userId } = req.query;

    let query = `
      SELECT g.*, u.name as poster_name, u.avatar as poster_avatar, u.rating as poster_rating,
             w.name as worker_name, w.avatar as worker_avatar
      FROM gigs g
      JOIN users u ON g.poster_id = u.id
      LEFT JOIN users w ON g.assigned_worker_id = w.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category && category !== 'All') {
      query += ` AND g.category = ?`;
      params.push(category);
    }

    if (status && status !== 'All') {
      query += ` AND g.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (g.title LIKE ? OR g.description LIKE ? OR g.location_name LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ` ORDER BY g.created_at DESC`;

    const gigs = db.prepare(query).all(...params) as any[];

    // Fetch skills for all gigs
    const gigSkillsStmt = db.prepare('SELECT gig_id, skill_name FROM gig_skills');
    const allGigSkills = gigSkillsStmt.all() as { gig_id: string; skill_name: string }[];
    const skillsMap = new Map<string, string[]>();
    for (const item of allGigSkills) {
      if (!skillsMap.has(item.gig_id)) skillsMap.set(item.gig_id, []);
      skillsMap.get(item.gig_id)!.push(item.skill_name);
    }

    const clientLat = userLat ? parseFloat(userLat as string) : null;
    const clientLon = userLon ? parseFloat(userLon as string) : null;

    const formatted = gigs.map(gig => {
      const skills = skillsMap.get(gig.id) || [];
      let distanceMeters: number | null = null;
      if (clientLat !== null && clientLon !== null) {
        distanceMeters = calculateDistanceMeters(clientLat, clientLon, gig.latitude, gig.longitude);
      }
      return {
        ...gig,
        skills,
        distanceMeters
      };
    });

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET single gig with details
gigsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const gig = db.prepare(`
      SELECT g.*, u.name as poster_name, u.avatar as poster_avatar, u.rating as poster_rating, u.course as poster_course,
             w.name as worker_name, w.avatar as worker_avatar, w.course as worker_course, w.rating as worker_rating
      FROM gigs g
      JOIN users u ON g.poster_id = u.id
      LEFT JOIN users w ON g.assigned_worker_id = w.id
      WHERE g.id = ?
    `).get(req.params.id) as any;

    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    const skills = db.prepare('SELECT skill_name FROM gig_skills WHERE gig_id = ?').all(gig.id).map((s: any) => s.skill_name);
    res.json({ ...gig, skills });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Requirement Extraction from Natural Description
gigsRouter.post('/extract', (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    const extracted = extractGigFromNaturalLanguage(prompt);
    res.json(extracted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new gig
gigsRouter.post('/', (req: Request, res: Response) => {
  try {
    const {
      poster_id, title, description, category, budget,
      location_name, latitude, longitude, deadline, urgency, skills
    } = req.body;

    if (!title || !budget || !poster_id) {
      return res.status(400).json({ error: 'Title, budget, and poster_id are required' });
    }

    const id = 'gig_' + Date.now();
    const budgetNum = Math.max(50, parseInt(budget, 10));
    const platformFee = Math.round(budgetNum * 0.05); // 5% fee
    const workerPayout = budgetNum - platformFee;

    db.prepare(`
      INSERT INTO gigs (
        id, poster_id, title, description, category, budget, platform_fee, worker_payout,
        location_name, latitude, longitude, deadline, urgency, status,
        assigned_worker_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', NULL, ?)
    `).run(
      id, poster_id, title, description || '', category || 'Design',
      budgetNum, platformFee, workerPayout,
      location_name || 'Block B', latitude || 28.5448, longitude || 77.1935,
      deadline || 'Tomorrow, 6:00 PM', urgency || 'Normal',
      new Date().toISOString()
    );

    if (Array.isArray(skills)) {
      const insertGigSkill = db.prepare('INSERT INTO gig_skills (gig_id, skill_name) VALUES (?, ?)');
      for (const skill of skills) {
        if (typeof skill === 'string' && skill.trim().length > 0) {
          insertGigSkill.run(id, skill.trim());
        }
      }
    }

    // Auto-calculate initial candidate matches & trigger Wave 1 notification dispatch
    try {
      const matchResult = calculateCandidateMatches(id);
      const wave1Candidates = matchResult.candidates.filter(c => c.recommendedWave === 1);
      const insertNotification = db.prepare(`
        INSERT INTO notifications (id, gig_id, user_id, wave, distance_meters, match_score, status, created_at)
        VALUES (?, ?, ?, 1, ?, ?, 'UNREAD', ?)
      `);

      for (const c of wave1Candidates) {
        insertNotification.run('notif_' + Date.now() + '_' + Math.random().toString(36).substring(7), id, c.userId, c.distanceMeters, c.matchScore, new Date().toISOString());
      }
    } catch (e) {
      console.error('Initial matching error:', e);
    }

    const created = db.prepare('SELECT * FROM gigs WHERE id = ?').get(id);
    broadcastWsEvent('GIG_CREATED', { gigId: id, title, budget: budgetNum });

    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET matching candidates for a gig with full score breakdown
gigsRouter.get('/:id/match', (req: Request, res: Response) => {
  try {
    const result = calculateCandidateMatches(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST trigger next wave notifications
gigsRouter.post('/:id/notify-wave', (req: Request, res: Response) => {
  try {
    const { wave } = req.body;
    const waveNum = parseInt(wave, 10);
    const matchResult = calculateCandidateMatches(req.params.id);

    // Candidates in this wave
    const waveCandidates = matchResult.candidates.filter(c => c.recommendedWave === waveNum);
    const insertNotification = db.prepare(`
      INSERT OR REPLACE INTO notifications (id, gig_id, user_id, wave, distance_meters, match_score, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'UNREAD', ?)
    `);

    for (const c of waveCandidates) {
      insertNotification.run('notif_' + Date.now() + '_' + Math.random().toString(36).substring(7), req.params.id, c.userId, waveNum, c.distanceMeters, c.matchScore, new Date().toISOString());
    }

    broadcastWsEvent('WAVE_ESCALATED', { gigId: req.params.id, wave: waveNum, candidatesCount: waveCandidates.length });

    res.json({
      success: true,
      wave: waveNum,
      candidatesNotified: waveCandidates.length,
      candidates: waveCandidates
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST accept gig (ATOMIC ASSIGNMENT WITH RACE CONDITION HANDLING)
gigsRouter.post('/:id/accept', (req: Request, res: Response) => {
  try {
    const { worker_id } = req.body;
    if (!worker_id) {
      return res.status(400).json({ error: 'worker_id is required' });
    }

    // ATOMIC TRANSACTION: Check status and assign immediately
    const checkStmt = db.prepare('SELECT status, assigned_worker_id, poster_id, title FROM gigs WHERE id = ?');
    const gig = checkStmt.get(req.params.id) as any;

    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    // Check if worker is attempting to accept their own gig
    if (gig.poster_id === worker_id) {
      return res.status(400).json({ error: 'You cannot accept a gig that you posted!' });
    }

    // Check for race condition: If gig is not in ACTIVE or NOTIFIED state, or already assigned
    if (gig.status !== 'ACTIVE' && gig.status !== 'NOTIFIED' && gig.status !== 'MATCHING') {
      return res.status(409).json({
        error: 'Sorry! This gig has already been accepted by another student or is no longer available.',
        currentStatus: gig.status
      });
    }

    if (gig.assigned_worker_id) {
      return res.status(409).json({
        error: 'Race condition detected: Gig was just assigned to someone else a moment ago.',
        assignedWorkerId: gig.assigned_worker_id
      });
    }

    // Atomically assign the worker
    const now = new Date().toISOString();
    const updateStmt = db.prepare(`
      UPDATE gigs
      SET status = 'ASSIGNED', assigned_worker_id = ?, assigned_at = ?
      WHERE id = ? AND (status = 'ACTIVE' OR status = 'NOTIFIED' OR status = 'MATCHING') AND assigned_worker_id IS NULL
    `);

    const result = updateStmt.run(worker_id, now, req.params.id);

    if (result.changes === 0) {
      return res.status(409).json({
        error: 'Race condition: Simultaneous acceptance attempt failed. Another student accepted first!'
      });
    }

    // Mark notifications for this gig as completed/dismissed for others
    db.prepare("UPDATE notifications SET status = 'ACCEPTED' WHERE gig_id = ? AND user_id = ?").run(req.params.id, worker_id);
    db.prepare("UPDATE notifications SET status = 'EXPIRED' WHERE gig_id = ? AND user_id != ?").run(req.params.id, worker_id);

    broadcastWsEvent('GIG_ASSIGNED', { gigId: req.params.id, workerId: worker_id, title: gig.title });

    const updatedGig = db.prepare('SELECT * FROM gigs WHERE id = ?').get(req.params.id);
    res.json({
      success: true,
      message: 'Gig successfully assigned to you!',
      gig: updatedGig
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST update gig status (e.g. IN_PROGRESS, SUBMITTED)
gigsRouter.post('/:id/status', (req: Request, res: Response) => {
  try {
    const { status, submission_notes, submission_link } = req.body;
    const gig = db.prepare('SELECT * FROM gigs WHERE id = ?').get(req.params.id) as any;
    if (!gig) return res.status(404).json({ error: 'Gig not found' });

    if (status === 'SUBMITTED') {
      db.prepare(`
        UPDATE gigs
        SET status = 'SUBMITTED', submission_notes = ?, submission_link = ?
        WHERE id = ?
      `).run(submission_notes || '', submission_link || '', req.params.id);
    } else {
      db.prepare(`UPDATE gigs SET status = ? WHERE id = ?`).run(status, req.params.id);
    }

    broadcastWsEvent('GIG_STATUS_UPDATED', { gigId: req.params.id, status });
    const updated = db.prepare('SELECT * FROM gigs WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST poster approves submitted gig and releases payment
gigsRouter.post('/:id/approve', (req: Request, res: Response) => {
  try {
    const gig = db.prepare('SELECT * FROM gigs WHERE id = ?').get(req.params.id) as any;
    if (!gig) return res.status(404).json({ error: 'Gig not found' });

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE gigs
      SET status = 'COMPLETED', completed_at = ?
      WHERE id = ?
    `).run(now, req.params.id);

    // Update worker's completed_gigs count and reputation
    if (gig.assigned_worker_id) {
      db.prepare(`
        UPDATE users
        SET completed_gigs = completed_gigs + 1
        WHERE id = ?
      `).run(gig.assigned_worker_id);
    }

    broadcastWsEvent('GIG_COMPLETED', {
      gigId: req.params.id,
      workerId: gig.assigned_worker_id,
      amount: gig.worker_payout
    });

    const updated = db.prepare('SELECT * FROM gigs WHERE id = ?').get(req.params.id);
    res.json({
      success: true,
      message: 'Gig completed! Payment released to worker.',
      gig: updated,
      payment: {
        budget: gig.budget,
        platformFee: gig.platform_fee,
        workerPayout: gig.worker_payout,
        status: 'PAID',
        transactionId: 'TXN_' + Date.now()
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST cancel gig
gigsRouter.post('/:id/cancel', (req: Request, res: Response) => {
  try {
    db.prepare("UPDATE gigs SET status = 'CANCELLED' WHERE id = ?").run(req.params.id);
    broadcastWsEvent('GIG_CANCELLED', { gigId: req.params.id });
    res.json({ success: true, message: 'Gig cancelled' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
