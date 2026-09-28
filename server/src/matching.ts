import { db } from './db.ts';

export interface UserCandidate {
  userId: string;
  name: string;
  course: string;
  year: string;
  avatar: string;
  locationName: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  skillMatchScore: number;
  matchedSkills: string[];
  distanceScore: number;
  availabilityScore: number;
  ratingScore: number;
  reliabilityScore: number;
  matchScore: number; // 0 to 100
  recommendedWave: number; // 1: 0-500m, 2: 500-1000m, 3: 1000-2000m, 4: >2000m
  isAvailable: boolean;
}

// Haversine Distance in meters
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Semantic Skill Mapping dictionary for campus gigs
const SKILL_CLUSTERS: Record<string, string[]> = {
  design: ['canva', 'photoshop', 'graphic design', 'figma', 'poster design', 'branding', 'illustrator'],
  coding: ['python', 'react', 'javascript', 'typescript', 'dbms', 'debugging', 'fastapi', 'backend development', 'web development'],
  events: ['stall setup', 'event logistics', 'event management', 'registration desk', 'crowd handling'],
  media: ['photography', 'video editing', 'reels', 'camera'],
  academics: ['study notes', 'ppt presentation', 'dbms', 'tutoring', 'technical writing', 'assignment help'],
  delivery: ['delivery', 'campus navigation', 'logistics', 'runner']
};

export function calculateSkillOverlap(
  userSkills: string[],
  requiredSkills: string[]
): { score: number; matched: string[] } {
  if (requiredSkills.length === 0) {
    return { score: 1.0, matched: [] };
  }

  const normalizedUser = userSkills.map(s => s.toLowerCase().trim());
  const normalizedReq = requiredSkills.map(s => s.toLowerCase().trim());

  let totalMatchPoints = 0;
  const matchedSet = new Set<string>();

  for (const req of normalizedReq) {
    // 1. Direct exact match (1.0 point)
    if (normalizedUser.includes(req)) {
      totalMatchPoints += 1.0;
      matchedSet.add(req);
      continue;
    }

    // 2. Semantic cluster match (0.75 points)
    let foundCluster = false;
    for (const cluster of Object.values(SKILL_CLUSTERS)) {
      if (cluster.includes(req)) {
        // Check if user has another skill in the same cluster
        const userMatchedClusterSkill = normalizedUser.find(u => cluster.includes(u));
        if (userMatchedClusterSkill) {
          totalMatchPoints += 0.75;
          matchedSet.add(`${userMatchedClusterSkill} (rel: ${req})`);
          foundCluster = true;
          break;
        }
      }
    }

    // 3. Substring partial match (0.5 points)
    if (!foundCluster) {
      const partial = normalizedUser.find(u => u.includes(req) || req.includes(u));
      if (partial) {
        totalMatchPoints += 0.5;
        matchedSet.add(`${partial} ~ ${req}`);
      }
    }
  }

  const score = Math.min(1.0, totalMatchPoints / normalizedReq.length);
  return { score, matched: Array.from(matchedSet) };
}

export function calculateCandidateMatches(gigId: string): {
  gig: any;
  candidates: UserCandidate[];
  summary: {
    totalStudents: number;
    eligibleCount: number;
    wave1Count: number;
    wave2Count: number;
    wave3Count: number;
    wave4Count: number;
  };
} {
  // Fetch gig
  const gigStmt = db.prepare('SELECT * FROM gigs WHERE id = ?');
  const gig = gigStmt.get(gigId) as any;
  if (!gig) {
    throw new Error(`Gig with id ${gigId} not found`);
  }

  // Fetch gig required skills
  const skillsStmt = db.prepare('SELECT skill_name FROM gig_skills WHERE gig_id = ?');
  const requiredSkills = (skillsStmt.all(gigId) as { skill_name: string }[]).map(s => s.skill_name);

  // Fetch all active students except the poster
  const usersStmt = db.prepare('SELECT * FROM users WHERE is_active = 1 AND id != ?');
  const allUsers = usersStmt.all(gig.poster_id) as any[];

  // Fetch all user skills
  const userSkillsStmt = db.prepare('SELECT user_id, skill_name, experience_level FROM user_skills');
  const allUserSkills = userSkillsStmt.all() as { user_id: string; skill_name: string; experience_level: string }[];

  const userSkillsMap = new Map<string, string[]>();
  for (const item of allUserSkills) {
    if (!userSkillsMap.has(item.user_id)) {
      userSkillsMap.set(item.user_id, []);
    }
    userSkillsMap.get(item.user_id)!.push(item.skill_name);
  }

  const candidates: UserCandidate[] = [];

  for (const user of allUsers) {
    const distanceMeters = calculateDistanceMeters(
      gig.latitude,
      gig.longitude,
      user.latitude,
      user.longitude
    );

    // Distance Score (0 to 1):
    // 0m = 1.0, 500m = 0.85, 1000m = 0.70, 2000m = 0.40, >3000m = 0.10
    const distanceScore = Math.max(0.1, 1 - distanceMeters / 2500);

    // Determine Wave based on distance
    let recommendedWave = 4;
    if (distanceMeters <= 500) recommendedWave = 1;
    else if (distanceMeters <= 1000) recommendedWave = 2;
    else if (distanceMeters <= 2000) recommendedWave = 3;

    // User skills and overlap
    const mySkills = userSkillsMap.get(user.id) || [];
    const { score: skillMatchScore, matched: matchedSkills } = calculateSkillOverlap(mySkills, requiredSkills);

    // Hard filter step: If gig requires specific skills, worker must have at least 0.25 skill match
    if (requiredSkills.length > 0 && skillMatchScore < 0.2) {
      continue; // Filtered out by skill eligibility
    }

    // Availability score (0 to 1)
    let availabilityScore = 0.8;
    const availLower = (user.availability || '').toLowerCase();
    if (availLower.includes('now') || availLower.includes('available')) availabilityScore = 1.0;
    else if (availLower.includes('evenings') || availLower.includes('weekends')) availabilityScore = 0.85;
    else if (availLower.includes('poster')) availabilityScore = 0.5;

    // Rating score (0 to 1): Rating out of 5
    const ratingScore = Math.min(1.0, (user.rating || 4.5) / 5.0);

    // Reliability score (0 to 1): Combination of completion rate & response rate
    const reliabilityScore = ((user.completion_rate || 0.95) * 0.6) + ((user.response_rate || 0.9) * 0.4);

    // Formula from Spec:
    // Match Score = Skill Match * 40% + Distance * 30% + Availability * 15% + Rating/History * 10% + Reliability * 5%
    const compositeScore =
      (skillMatchScore * 0.40) +
      (distanceScore * 0.30) +
      (availabilityScore * 0.15) +
      (ratingScore * 0.10) +
      (reliabilityScore * 0.05);

    const matchScore = Math.round(compositeScore * 100);

    candidates.push({
      userId: user.id,
      name: user.name,
      course: user.course,
      year: user.year,
      avatar: user.avatar,
      locationName: user.location_name,
      latitude: user.latitude,
      longitude: user.longitude,
      distanceMeters,
      skillMatchScore: Math.round(skillMatchScore * 100),
      matchedSkills,
      distanceScore: Math.round(distanceScore * 100),
      availabilityScore: Math.round(availabilityScore * 100),
      ratingScore: Math.round(ratingScore * 100),
      reliabilityScore: Math.round(reliabilityScore * 100),
      matchScore,
      recommendedWave,
      isAvailable: availabilityScore >= 0.7
    });
  }

  // Sort candidates by matchScore descending, then distance ascending
  candidates.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return a.distanceMeters - b.distanceMeters;
  });

  return {
    gig: {
      ...gig,
      requiredSkills
    },
    candidates,
    summary: {
      totalStudents: allUsers.length + 1,
      eligibleCount: candidates.length,
      wave1Count: candidates.filter(c => c.recommendedWave === 1).length,
      wave2Count: candidates.filter(c => c.recommendedWave === 2).length,
      wave3Count: candidates.filter(c => c.recommendedWave === 3).length,
      wave4Count: candidates.filter(c => c.recommendedWave === 4).length
    }
  };
}
