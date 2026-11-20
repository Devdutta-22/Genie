/**
 * ============================================================================
 * NOTIFICATIONS ROUTER (Prisma 8 / PostgreSQL Notification Schema)
 * ============================================================================
 * 
 * PostgreSQL & Prisma 8 Multi-Schema Architecture:
 * 1. notification.notifications (`Notification` model in `notification` namespace):
 *    - Main table storing all in-app notifications, wave alerts, and claim updates.
 *    - Columns:
 *      * id: UUID primary key (default gen_random_uuid())
 *      * user_id: UUID foreign key referencing core.users(id)
 *      * type: TEXT describing notification category (e.g. 'GIG_MATCH_WAVE_1')
 *      * title: TEXT summary header
 *      * message: TEXT detailed notification body
 *      * related_gig_id: UUID nullable foreign key referencing marketplace.gigs(id)
 *      * data: JSONB arbitrary payload (stores wave number, distanceMeters, matchScore)
 *      * is_read: BOOLEAN status (default false)
 *      * read_at: TIMESTAMPTZ timestamp when marked read
 *      * created_at: TIMESTAMPTZ dispatch timestamp
 * 
 * 2. marketplace.gigs (`Gig` model in `marketplace` namespace):
 *    - Associated gig context referenced via `relatedGigId`.
 *    - Supplies task title, reward (budget), deadlineAt, and status.
 * 
 * 3. core.user_profiles (`UserProfile` model in `core` namespace):
 *    - Holds requester profile details (fullName, avatarUrl) to display
 *      the task poster's avatar and name in notification cards.
 * ============================================================================
 */

import express from 'express';
import { db } from '../db.js';

export const notificationsRouter = express.Router();

// Standard RFC 4122 UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================================================
// GET /api/notifications/:userId - Retrieve all notifications for a student
// ============================================================================
notificationsRouter.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate UUID format to prevent PostgreSQL query syntax errors
    if (!userId || !UUID_REGEX.test(userId)) {
      return res.json([]);
    }

    // 1. Fetch user notifications from notification.notifications via Prisma 8 ORM
    const notifications = await db.orm.notification.Notification.where({ userId }).all();

    // If no notification records exist for that user, return empty array immediately
    if (notifications.length === 0) {
      return res.json([]);
    }

    // 2. Fetch related gigs, categories, and poster profiles for contextual display
    const [allGigs, allCategories, allProfiles] = await Promise.all([
      db.orm.marketplace.Gig.all(),
      db.orm.marketplace.Category.all(),
      db.orm.core.UserProfile.all()
    ]);

    const gigMap = new Map(allGigs.map((g) => [g.id, g]));
    const catMap = new Map(allCategories.map((c) => [c.id, c.name]));
    const profileMap = new Map(allProfiles.map((p) => [p.userId, p]));

    // Sort notifications chronologically (newest first)
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 3. Assemble unified response matching legacy and current frontend contracts
    const formatted = notifications.map((n) => {
      const gig = n.relatedGigId ? gigMap.get(n.relatedGigId) : null;
      const poster = gig ? profileMap.get(gig.requesterId) : null;
      const categoryName = gig && gig.categoryId ? (catMap.get(gig.categoryId) || 'Campus Task') : 'Campus Task';
      const rewardNum = gig ? parseFloat(gig.reward) : null;
      const payloadData = n.data || {};

      return {
        id: n.id,
        user_id: n.userId,
        userId: n.userId,
        gig_id: n.relatedGigId,
        relatedGigId: n.relatedGigId,
        type: n.type,
        title: n.title,
        message: n.message,
        data: payloadData,
        wave: payloadData.wave || 1,
        distance_meters: payloadData.distanceMeters || null,
        match_score: payloadData.matchScore || null,
        status: n.isRead ? 'READ' : 'UNREAD',
        is_read: n.isRead,
        isRead: n.isRead,
        read_at: n.readAt,
        readAt: n.readAt,
        created_at: n.createdAt,
        createdAt: n.createdAt,
        gig_title: gig ? gig.title : '',
        gig_category: categoryName,
        gig_budget: rewardNum,
        gig_location: 'Campus Center',
        gig_deadline: gig?.deadlineAt ? gig.deadlineAt.toISOString() : '',
        gig_status: gig ? gig.status : '',
        poster_name: poster ? poster.fullName : 'Campus Peer',
        poster_avatar: poster ? poster.avatarUrl : ''
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// PUT /api/notifications/:id/read - Mark a notification as read
// ============================================================================
notificationsRouter.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    if (!id || !UUID_REGEX.test(id)) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Update notification status in notification.notifications via Prisma 8 ORM
    const updated = await db.orm.notification.Notification.where({ id }).update({
      isRead: true,
      readAt: new Date()
    });

    if (!updated) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification: updated
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ error: error.message });
  }
});
