import express from 'express';
import type { Request, Response } from 'express';
import { db } from '../db.ts';
import { broadcastWsEvent } from '../index.ts';

const Router = express.Router;

export const ratingsRouter = Router();

// POST submit rating for a gig
ratingsRouter.post('/:gigId', (req: Request, res: Response) => {
  try {
    const { from_user_id, to_user_id, communication_rating, quality_rating, reliability_rating, review } = req.body;
    if (!from_user_id || !to_user_id) {
      return res.status(400).json({ error: 'from_user_id and to_user_id are required' });
    }

    const cRating = Math.min(5, Math.max(1, parseInt(communication_rating || '5', 10)));
    const qRating = Math.min(5, Math.max(1, parseInt(quality_rating || '5', 10)));
    const rRating = Math.min(5, Math.max(1, parseInt(reliability_rating || '5', 10)));
    const overallRating = Math.round(((cRating + qRating + rRating) / 3) * 10) / 10;

    const id = 'rat_' + Date.now();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO ratings (id, gig_id, from_user_id, to_user_id, rating, communication_rating, quality_rating, reliability_rating, review, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.params.gigId, from_user_id, to_user_id, overallRating, cRating, qRating, rRating, review || '', now);

    // Recalculate recipient user's average rating
    const recipient = db.prepare('SELECT rating, rating_count FROM users WHERE id = ?').get(to_user_id) as any;
    if (recipient) {
      const currentCount = recipient.rating_count || 0;
      const currentRating = recipient.rating || 5.0;
      const newCount = currentCount + 1;
      const newRating = Math.round((((currentRating * currentCount) + overallRating) / newCount) * 10) / 10;

      db.prepare(`
        UPDATE users
        SET rating = ?, rating_count = ?
        WHERE id = ?
      `).run(newRating, newCount, to_user_id);
    }

    // Mark gig status as RATED or CLOSED
    db.prepare("UPDATE gigs SET status = 'CLOSED' WHERE id = ?").run(req.params.gigId);

    broadcastWsEvent('GIG_RATED', { gigId: req.params.gigId, toUserId: to_user_id, rating: overallRating });

    res.status(201).json({
      success: true,
      message: 'Rating and review recorded successfully!',
      rating: overallRating
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
