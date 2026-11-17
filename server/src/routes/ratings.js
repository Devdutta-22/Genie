import express from 'express';
import { db } from '../db.js';
import { broadcastWsEvent } from '../ws.js';

const Router = express.Router;
export const ratingsRouter = Router();

// POST submit rating for a gig
ratingsRouter.post('/:gigId', (req, res) => {
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

    // Recompute recipient average rating
    const avgData = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as count
      FROM ratings
      WHERE to_user_id = ?
    `).get(to_user_id);

    if (avgData && avgData.count > 0) {
      const roundedAvg = Math.round(avgData.avg_rating * 10) / 10;
      db.prepare(`
        UPDATE users
        SET rating = ?, rating_count = ?
        WHERE id = ?
      `).run(roundedAvg, avgData.count, to_user_id);
    }

    broadcastWsEvent('NEW_RATING', { gigId: req.params.gigId, toUserId: to_user_id, rating: overallRating });

    res.status(201).json({
      success: true,
      ratingId: id,
      overallRating,
      message: 'Review recorded successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
