import express from 'express';
import type { Request, Response } from 'express';
import { db } from '../db.ts';

const Router = express.Router;

export const notificationsRouter = Router();

// GET notifications for a specific user
notificationsRouter.get('/:userId', (req: Request, res: Response) => {
  try {
    const notifications = db.prepare(`
      SELECT n.*, g.title as gig_title, g.category as gig_category, g.budget as gig_budget,
             g.location_name as gig_location, g.deadline as gig_deadline, g.status as gig_status,
             u.name as poster_name, u.avatar as poster_avatar
      FROM notifications n
      JOIN gigs g ON n.gig_id = g.id
      JOIN users u ON g.poster_id = u.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
    `).all(req.params.userId);

    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
notificationsRouter.put('/:id/read', (req: Request, res: Response) => {
  try {
    db.prepare("UPDATE notifications SET status = 'READ' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
