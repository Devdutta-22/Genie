/**
 * ============================================================================
 * RATINGS ROUTER (Prisma 8 / PostgreSQL Reputation Schema)
 * ============================================================================
 * 
 * PostgreSQL Schemas & Tables Used:
 * 1. reputation.ratings:
 *    - Captures multi-dimensional star reviews (score, communicationScore,
 *      qualityScore, reliabilityScore, comment).
 * 2. reputation.reputation_history:
 *    - Audit log recording changes in student trust and reputation scores.
 * 3. core.user_profiles:
 *    - Stores running average rating calculated across completed gigs.
 * 4. core.users:
 *    - Updates trust_score based on platform feedback.
 * ============================================================================
 */

import express from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { broadcastWsEvent } from '../ws.js';

export const ratingsRouter = express.Router();

// ============================================================================
// POST /api/ratings/:gigId - Submit a peer review and star rating for a completed gig
// ============================================================================
ratingsRouter.post('/:gigId', async (req, res) => {
  try {
    const { gigId } = req.params;
    const {
      from_user_id,
      to_user_id,
      communication_rating,
      quality_rating,
      reliability_rating,
      review
    } = req.body;

    if (!from_user_id || !to_user_id) {
      return res.status(400).json({ error: 'from_user_id and to_user_id are required' });
    }

    const cRating = Math.min(5, Math.max(1, parseInt(communication_rating || '5', 10)));
    const qRating = Math.min(5, Math.max(1, parseInt(quality_rating || '5', 10)));
    const rRating = Math.min(5, Math.max(1, parseInt(reliability_rating || '5', 10)));
    const overallRating = Math.round(((cRating + qRating + rRating) / 3) * 10) / 10;
    const scoreInt = Math.round(overallRating);

    const ratingId = crypto.randomUUID();

    // 1. Insert review into reputation.ratings
    await db.orm.reputation.Rating.create({
      id: ratingId,
      gigId,
      raterId: from_user_id,
      ratedId: to_user_id,
      score: scoreInt,
      communicationScore: cRating,
      qualityScore: qRating,
      reliabilityScore: rRating,
      comment: review ? review.trim() : ''
    });

    // 2. Recompute recipient's running average rating
    const allRatings = await db.orm.reputation.Rating.where({ ratedId: to_user_id }).all();
    if (allRatings.length > 0) {
      const sum = allRatings.reduce((acc, curr) => acc + curr.score, 0);
      const avg = Math.round((sum / allRatings.length) * 10) / 10;

      // Update core.user_profiles.rating_average
      await db.orm.core.UserProfile.where({ userId: to_user_id }).update({
        ratingAverage: avg
      });

      // Update core.users.trust_score
      const user = await db.orm.core.User.where({ id: to_user_id }).first();
      if (user) {
        const previousScore = parseFloat(user.trustScore || 50);
        const newScore = Math.min(100, Math.max(0, previousScore + (avg >= 4 ? 2.5 : -1.5)));

        await db.orm.core.User.where({ id: to_user_id }).update({
          trustScore: newScore
        });

        // Record reputation history entry
        await db.orm.reputation.ReputationHistory.create({
          userId: to_user_id,
          previousScore,
          newScore,
          reason: `Review submitted for gig ${gigId} (Rating: ${avg}/5)`,
          referenceId: gigId
        });
      }
    }

    // 3. Broadcast real-time rating event via WebSocket
    broadcastWsEvent('NEW_RATING', {
      gigId,
      toUserId: to_user_id,
      rating: overallRating
    });

    res.status(201).json({
      success: true,
      ratingId,
      overallRating,
      message: 'Review recorded successfully'
    });
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ error: error.message });
  }
});
