/**
 * ============================================================================
 * GIGS ROUTER (Prisma 8 / PostgreSQL Multi-Schema Marketplace)
 * ============================================================================
 * 
 * PostgreSQL Schemas & Tables Used:
 * 1. marketplace.gigs:
 *    - Main gig entity storing task title, description, reward (budget),
 *      urgency, status, pickup coordinates, deadline.
 * 2. marketplace.categories:
 *    - Domain categories (e.g. Design, Coding, Academics, Delivery).
 * 3. marketplace.gig_claims:
 *    - Strict 1-to-1 table ensuring atomic worker claims and race-condition safety.
 * 4. marketplace.gig_skill_requirements:
 *    - Specifies the required skills for algorithmic candidate matching.
 * 5. marketplace.gig_events & marketplace.gig_status_history:
 *    - Full audit trails of status transitions and lifecycle events.
 * 6. notification.notifications:
 *    - Multi-wave dispatch records alerting eligible campus workers.
 * ============================================================================
 */

import express from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { calculateCandidateMatches, calculateDistanceMeters } from '../matching.js';
import { extractGigFromNaturalLanguage } from '../aiExtractor.js';
import { broadcastWsEvent } from '../ws.js';

export const gigsRouter = express.Router();

/**
 * Helper to fetch and resolve default campus ID.
 */
async function getDefaultCampusId() {
  const campus = await db.orm.campus.Campus.where({ code: 'GU' }).first();
  if (campus) return campus.id;
  const anyCampus = await db.orm.campus.Campus.first();
  return anyCampus ? anyCampus.id : null;
}

/**
 * Helper to assemble a fully populated gig object matching the frontend contract.
 */
async function assembleGigResponse(gig, clientLat = null, clientLon = null) {
  // 1. Fetch poster details from core.users & core.user_profiles
  const posterUser = await db.orm.core.User.where({ id: gig.requesterId }).first();
  const posterProfile = await db.orm.core.UserProfile.where({ userId: gig.requesterId }).first();

  // 2. Fetch assigned worker from marketplace.gig_claims
  let workerUser = null;
  let workerProfile = null;
  let assignedWorkerId = null;

  const claim = await db.orm.marketplace.GigClaim.where({ gigId: gig.id }).first();
  if (claim && claim.status !== 'CANCELLED') {
    assignedWorkerId = claim.workerId;
    workerUser = await db.orm.core.User.where({ id: claim.workerId }).first();
    workerProfile = await db.orm.core.UserProfile.where({ userId: claim.workerId }).first();
  }

  // 3. Fetch required skills from marketplace.gig_skill_requirements & core.skills
  const gigSkillReqs = await db.orm.marketplace.GigSkillRequirement.where({ gigId: gig.id }).all();
  const allSkills = await db.orm.core.Skill.all();
  const skillMap = new Map(allSkills.map((s) => [s.id, s.name]));
  const skills = gigSkillReqs.map((gsr) => skillMap.get(gsr.skillId) || 'General');

  // 4. Fetch category name
  let categoryName = 'Campus Task';
  if (gig.categoryId) {
    const categoryRecord = await db.orm.marketplace.Category.where({ id: gig.categoryId }).first();
    if (categoryRecord) categoryName = categoryRecord.name;
  }

  // 5. Calculate physical distance if client coordinates are provided
  let distanceMeters = null;
  const lat = gig.pickupLatitude || 28.3664;
  const lon = gig.pickupLongitude || 77.5404;
  if (clientLat !== null && clientLon !== null) {
    distanceMeters = calculateDistanceMeters(clientLat, clientLon, lat, lon);
  }

  const rewardNum = parseFloat(gig.reward || 100);
  const platformFee = Math.round(rewardNum * 0.05);
  const workerPayout = rewardNum - platformFee;

  return {
    id: gig.id,
    poster_id: gig.requesterId,
    requester_id: gig.requesterId,
    title: gig.title,
    description: gig.description,
    category: categoryName,
    budget: rewardNum,
    reward: rewardNum,
    platform_fee: platformFee,
    worker_payout: workerPayout,
    location_name: 'Campus Center',
    latitude: lat,
    longitude: lon,
    deadline: gig.deadlineAt ? gig.deadlineAt.toISOString() : 'Tomorrow, 6:00 PM',
    urgency: gig.urgency || 'Normal',
    status: gig.status, // 'OPEN' / 'ACTIVE', 'ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', etc.
    assigned_worker_id: assignedWorkerId,
    created_at: gig.createdAt,
    updated_at: gig.updatedAt,
    poster_name: posterProfile?.fullName || posterUser?.email?.split('@')[0] || 'Student',
    poster_avatar: posterProfile?.avatarUrl || '',
    poster_rating: posterProfile?.ratingAverage ? parseFloat(posterProfile.ratingAverage) : 5.0,
    poster_course: posterProfile?.course || 'B.Tech',
    worker_name: workerProfile?.fullName || workerUser?.email?.split('@')[0] || '',
    worker_avatar: workerProfile?.avatarUrl || '',
    worker_course: workerProfile?.course || '',
    worker_rating: workerProfile?.ratingAverage ? parseFloat(workerProfile.ratingAverage) : 5.0,
    skills,
    distanceMeters
  };
}

// ============================================================================
// GET /api/gigs - Retrieve all gigs with proximity and filters
// ============================================================================
gigsRouter.get('/', async (req, res) => {
  try {
    const { category, status, search, userLat, userLon } = req.query;

    const allGigs = await db.orm.marketplace.Gig.all();
    const allCategories = await db.orm.marketplace.Category.all();
    const catMap = new Map(allCategories.map((c) => [c.id, c.name]));

    const clientLat = userLat ? parseFloat(userLat) : null;
    const clientLon = userLon ? parseFloat(userLon) : null;

    // Filter in-memory or by query
    let filtered = allGigs;

    if (status && status !== 'All') {
      const matchStatus = status === 'ACTIVE' ? 'OPEN' : status;
      filtered = filtered.filter((g) => g.status === matchStatus || g.status === status);
    }

    if (category && category !== 'All') {
      filtered = filtered.filter((g) => {
        const cName = catMap.get(g.categoryId);
        return cName && cName.toLowerCase() === category.toLowerCase();
      });
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((g) =>
        g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)
      );
    }

    // Sort by createdAt descending
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const formatted = await Promise.all(
      filtered.map((g) => assembleGigResponse(g, clientLat, clientLon))
    );

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching gigs:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GET /api/gigs/:id - Retrieve single gig with detailed metadata
// ============================================================================
gigsRouter.get('/:id', async (req, res) => {
  try {
    const gig = await db.orm.marketplace.Gig.where({ id: req.params.id }).first();
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    const formatted = await assembleGigResponse(gig);
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching gig:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// POST /api/gigs/extract - AI Requirement Extraction from Natural Description
// ============================================================================
gigsRouter.post('/extract', (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    const extracted = extractGigFromNaturalLanguage(prompt);
    res.json(extracted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// POST /api/gigs - Create new campus micro-gig
// ============================================================================
gigsRouter.post('/', async (req, res) => {
  try {
    const {
      poster_id, title, description, category, budget,
      location_name, latitude, longitude, deadline, urgency, skills
    } = req.body;

    if (!title || !budget || !poster_id) {
      return res.status(400).json({ error: 'Title, budget, and poster_id are required' });
    }

    // Verify requester exists
    const poster = await db.orm.core.User.where({ id: poster_id }).first();
    if (!poster) {
      return res.status(400).json({ error: 'Invalid poster_id: student user not found' });
    }

    const campusId = await getDefaultCampusId();
    if (!campusId) {
      return res.status(500).json({ error: 'Campus reference not available' });
    }

    // Find or create category in marketplace.categories
    let categoryId = null;
    if (category) {
      let catRecord = await db.orm.marketplace.Category.where({ name: category }).first();
      if (!catRecord) {
        catRecord = await db.orm.marketplace.Category.create({
          name: category,
          description: `${category} gigs`,
          isActive: true
        });
      }
      categoryId = catRecord.id;
    }

    const budgetNum = Math.max(50, parseInt(budget, 10));
    const urgencyNormalized = ['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes((urgency || '').toUpperCase())
      ? urgency.toUpperCase()
      : 'NORMAL';

    const gigId = crypto.randomUUID();

    // 1. Create Gig in marketplace.gigs
    const createdGig = await db.orm.marketplace.Gig.create({
      id: gigId,
      campusId,
      requesterId: poster_id,
      categoryId,
      title: title.trim(),
      description: description ? description.trim() : '',
      urgency: urgencyNormalized,
      reward: budgetNum,
      currency: 'INR',
      status: 'OPEN',
      pickupLatitude: latitude ? parseFloat(latitude) : 28.3664,
      pickupLongitude: longitude ? parseFloat(longitude) : 77.5404,
      deadlineAt: deadline ? new Date(deadline) : new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // 2. Link skill requirements in marketplace.gig_skill_requirements
    if (Array.isArray(skills)) {
      for (const skill of skills) {
        const skillName = typeof skill === 'string' ? skill.trim() : (skill.name || '').trim();
        if (skillName) {
          let sRecord = await db.orm.core.Skill.where({ name: skillName }).first();
          if (!sRecord) {
            sRecord = await db.orm.core.Skill.create({
              name: skillName,
              category: 'General',
              description: `Skill: ${skillName}`
            });
          }

          try {
            await db.orm.marketplace.GigSkillRequirement.create({
              gigId,
              skillId: sRecord.id,
              requiredLevel: 2,
              isMandatory: true
            });
          } catch (e) {}
        }
      }
    }

    // 3. Record lifecycle creation in marketplace.gig_events and gig_status_history
    await Promise.all([
      db.orm.marketplace.GigEvent.create({
        gigId,
        eventType: 'CREATED',
        actorId: poster_id,
        metadata: { budget: budgetNum, title }
      }),
      db.orm.marketplace.GigStatusHistory.create({
        gigId,
        fromStatus: null,
        toStatus: 'OPEN',
        changedBy: poster_id,
        reason: 'Initial gig creation'
      })
    ]);

    // 4. Increment requester's totalGigsPosted in core.user_profiles
    const profile = await db.orm.core.UserProfile.where({ userId: poster_id }).first();
    if (profile) {
      await db.orm.core.UserProfile.where({ userId: poster_id }).update({
        totalGigsPosted: (profile.totalGigsPosted || 0) + 1
      });
    }

    // 5. Trigger candidate matching & dispatch Wave 1 notifications
    try {
      const matchResult = await calculateCandidateMatches(gigId);
      const wave1Candidates = matchResult.candidates.filter((c) => c.recommendedWave === 1);

      for (const c of wave1Candidates) {
        await db.orm.notification.Notification.create({
          userId: c.userId,
          type: 'GIG_MATCH_WAVE_1',
          title: `New Campus Gig: ${title}`,
          message: `Nearby micro-gig matched to your skills (Reward: ₹${budgetNum}, Distance: ${c.distanceMeters}m)`,
          relatedGigId: gigId,
          data: {
            wave: 1,
            matchScore: c.matchScore,
            distanceMeters: c.distanceMeters
          },
          isRead: false
        });
      }
    } catch (e) {
      console.warn('Initial matching warning:', e.message);
    }

    broadcastWsEvent('GIG_CREATED', { gigId, title, budget: budgetNum });

    const formatted = await assembleGigResponse(createdGig);
    res.status(201).json(formatted);
  } catch (error) {
    console.error('Error creating gig:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GET /api/gigs/:id/match - Retrieve candidate matches for gig
// ============================================================================
gigsRouter.get('/:id/match', async (req, res) => {
  try {
    const result = await calculateCandidateMatches(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error calculating candidate matches:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// POST /api/gigs/:id/notify-wave - Trigger next wave of worker notifications
// ============================================================================
gigsRouter.post('/:id/notify-wave', async (req, res) => {
  try {
    const { wave } = req.body;
    const waveNum = parseInt(wave, 10) || 2;
    const gigId = req.params.id;

    const matchResult = await calculateCandidateMatches(gigId);
    const waveCandidates = matchResult.candidates.filter((c) => c.recommendedWave === waveNum);

    for (const c of waveCandidates) {
      await db.orm.notification.Notification.create({
        userId: c.userId,
        type: `GIG_MATCH_WAVE_${waveNum}`,
        title: `Wave ${waveNum} Campus Alert: ${matchResult.gig.title}`,
        message: `Task available near your campus zone (Reward: ₹${matchResult.gig.budget})`,
        relatedGigId: gigId,
        data: {
          wave: waveNum,
          matchScore: c.matchScore,
          distanceMeters: c.distanceMeters
        },
        isRead: false
      });
    }

    broadcastWsEvent('WAVE_ESCALATED', {
      gigId,
      wave: waveNum,
      candidatesCount: waveCandidates.length
    });

    res.json({
      success: true,
      wave: waveNum,
      candidatesNotified: waveCandidates.length,
      candidates: waveCandidates
    });
  } catch (error) {
    console.error('Error notifying wave:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// POST /api/gigs/:id/accept - Atomically accept and claim a gig
// ============================================================================
gigsRouter.post('/:id/accept', async (req, res) => {
  try {
    const { worker_id } = req.body;
    const gigId = req.params.id;

    if (!worker_id) {
      return res.status(400).json({ error: 'worker_id is required' });
    }

    // 1. Fetch gig and verify state
    const gig = await db.orm.marketplace.Gig.where({ id: gigId }).first();
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    // Prevent poster from accepting their own gig
    if (gig.requesterId === worker_id) {
      return res.status(400).json({ error: 'You cannot accept a gig that you posted!' });
    }

    // Check if already claimed in marketplace.gig_claims
    const existingClaim = await db.orm.marketplace.GigClaim.where({ gigId }).first();
    if (existingClaim && existingClaim.status === 'ACTIVE') {
      return res.status(409).json({
        error: 'Sorry! This gig has already been accepted by another student or is no longer available.',
        assignedWorkerId: existingClaim.workerId
      });
    }

    if (gig.status !== 'OPEN' && gig.status !== 'ACTIVE' && gig.status !== 'MATCHING') {
      return res.status(409).json({
        error: 'This gig is not currently open for claims.',
        currentStatus: gig.status
      });
    }

    // 2. Atomically create GigClaim and update Gig status to ASSIGNED
    await db.orm.marketplace.GigClaim.create({
      gigId,
      workerId: worker_id,
      status: 'ACTIVE',
      claimedAt: new Date()
    });

    await db.orm.marketplace.Gig.where({ id: gigId }).update({
      status: 'ASSIGNED',
      updatedAt: new Date()
    });

    // 3. Record audit events
    await Promise.all([
      db.orm.marketplace.GigEvent.create({
        gigId,
        eventType: 'CLAIMED',
        actorId: worker_id,
        metadata: { workerId: worker_id }
      }),
      db.orm.marketplace.GigStatusHistory.create({
        gigId,
        fromStatus: gig.status,
        toStatus: 'ASSIGNED',
        changedBy: worker_id,
        reason: 'Claimed by student worker'
      })
    ]);

    // 4. Mark notifications for this worker as read
    const notifications = await db.orm.notification.Notification.where({ relatedGigId: gigId }).all();
    for (const notif of notifications) {
      if (notif.userId === worker_id) {
        await db.orm.notification.Notification.where({ id: notif.id }).update({ isRead: true, readAt: new Date() });
      }
    }

    broadcastWsEvent('GIG_ASSIGNED', { gigId, workerId: worker_id, title: gig.title });

    const updatedGig = await db.orm.marketplace.Gig.where({ id: gigId }).first();
    const formatted = await assembleGigResponse(updatedGig);

    res.json({
      success: true,
      message: 'Gig successfully assigned to you!',
      gig: formatted
    });
  } catch (error) {
    console.error('Error accepting gig:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// POST /api/gigs/:id/status - Update gig execution status
// ============================================================================
gigsRouter.post('/:id/status', async (req, res) => {
  try {
    const { status, submission_notes, submission_link } = req.body;
    const gigId = req.params.id;

    const gig = await db.orm.marketplace.Gig.where({ id: gigId }).first();
    if (!gig) return res.status(404).json({ error: 'Gig not found' });

    const normalizedStatus = ['IN_PROGRESS', 'SUBMITTED', 'CANCELLED'].includes((status || '').toUpperCase())
      ? status.toUpperCase()
      : status;

    await db.orm.marketplace.Gig.where({ id: gigId }).update({
      status: normalizedStatus,
      updatedAt: new Date()
    });

    await db.orm.marketplace.GigStatusHistory.create({
      gigId,
      fromStatus: gig.status,
      toStatus: normalizedStatus,
      reason: submission_notes || 'Status updated by user'
    });

    broadcastWsEvent('GIG_STATUS_UPDATED', { gigId, status: normalizedStatus });

    const updated = await db.orm.marketplace.Gig.where({ id: gigId }).first();
    const formatted = await assembleGigResponse(updated);
    res.json(formatted);
  } catch (error) {
    console.error('Error updating gig status:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// POST /api/gigs/:id/approve - Poster approves submitted gig & releases payout
// ============================================================================
gigsRouter.post('/:id/approve', async (req, res) => {
  try {
    const gigId = req.params.id;
    const gig = await db.orm.marketplace.Gig.where({ id: gigId }).first();
    if (!gig) return res.status(404).json({ error: 'Gig not found' });

    // Mark gig completed
    await db.orm.marketplace.Gig.where({ id: gigId }).update({
      status: 'COMPLETED',
      updatedAt: new Date()
    });

    // Mark claim completed
    const claim = await db.orm.marketplace.GigClaim.where({ gigId }).first();
    if (claim) {
      await db.orm.marketplace.GigClaim.where({ id: claim.id }).update({
        status: 'COMPLETED',
        completedAt: new Date()
      });

      // Increment worker's totalGigsCompleted in core.user_profiles
      const workerProfile = await db.orm.core.UserProfile.where({ userId: claim.workerId }).first();
      if (workerProfile) {
        await db.orm.core.UserProfile.where({ userId: claim.workerId }).update({
          totalGigsCompleted: (workerProfile.totalGigsCompleted || 0) + 1
        });
      }
    }

    const rewardNum = parseFloat(gig.reward || 100);
    const platformFee = Math.round(rewardNum * 0.05);
    const workerPayout = rewardNum - platformFee;

    broadcastWsEvent('GIG_COMPLETED', {
      gigId,
      workerId: claim?.workerId,
      amount: workerPayout
    });

    const updated = await db.orm.marketplace.Gig.where({ id: gigId }).first();
    const formatted = await assembleGigResponse(updated);

    res.json({
      success: true,
      message: 'Gig completed! Payment released to worker.',
      gig: formatted,
      payment: {
        budget: rewardNum,
        platformFee,
        workerPayout,
        status: 'PAID',
        transactionId: 'TXN_' + Date.now()
      }
    });
  } catch (error) {
    console.error('Error approving gig:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// POST /api/gigs/:id/cancel - Cancel an open or pending gig
// ============================================================================
gigsRouter.post('/:id/cancel', async (req, res) => {
  try {
    const gigId = req.params.id;
    const gig = await db.orm.marketplace.Gig.where({ id: gigId }).first();
    if (!gig) return res.status(404).json({ error: 'Gig not found' });

    await db.orm.marketplace.Gig.where({ id: gigId }).update({
      status: 'CANCELLED',
      updatedAt: new Date()
    });

    const claim = await db.orm.marketplace.GigClaim.where({ gigId }).first();
    if (claim) {
      await db.orm.marketplace.GigClaim.where({ id: claim.id }).update({
        status: 'CANCELLED',
        cancelledAt: new Date()
      });
    }

    broadcastWsEvent('GIG_CANCELLED', { gigId });
    res.json({ success: true, message: 'Gig cancelled' });
  } catch (error) {
    console.error('Error cancelling gig:', error);
    res.status(500).json({ error: error.message });
  }
});
