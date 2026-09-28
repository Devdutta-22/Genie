export interface ExtractedGigRequirements {
  title: string;
  category: 'Design' | 'Tech/Coding' | 'Academics' | 'Logistics' | 'Events' | 'Media' | 'Delivery';
  skills: string[];
  budget: number;
  deadline: string;
  urgency: 'Low' | 'Normal' | 'Urgent';
  locationName: string;
  latitude: number;
  longitude: number;
  confidence: number;
}

const CAMPUS_LOCATIONS: Record<string, { lat: number; lon: number; name: string }> = {
  'block a': { lat: 28.5455, lon: 77.1920, name: 'Block A (CSE Dept)' },
  'block b': { lat: 28.5448, lon: 77.1935, name: 'Block B (Tech Hub)' },
  'block c': { lat: 28.5470, lon: 77.1915, name: 'Block C (Science Labs)' },
  'library': { lat: 28.5435, lon: 77.1940, name: 'Central Library' },
  'hostel': { lat: 28.5420, lon: 77.1905, name: 'Hostel 4 (Block D)' },
  'hostel 4': { lat: 28.5420, lon: 77.1905, name: 'Hostel 4 (Block D)' },
  'canteen': { lat: 28.5440, lon: 77.1918, name: 'Student Activity Center (SAC)' },
  'sac': { lat: 28.5440, lon: 77.1918, name: 'Student Activity Center (SAC)' },
  'sports': { lat: 28.5480, lon: 77.1950, name: 'Sports Complex & Grounds' }
};

export function extractGigFromNaturalLanguage(prompt: string): ExtractedGigRequirements {
  const text = prompt.toLowerCase();

  // 1. Detect Category & Skills
  let category: ExtractedGigRequirements['category'] = 'Design';
  const skills: Set<string> = new Set();

  if (text.includes('poster') || text.includes('banner') || text.includes('flyer') || text.includes('graphic') || text.includes('canva') || text.includes('photoshop') || text.includes('figma') || text.includes('logo')) {
    category = 'Design';
    if (text.includes('canva')) skills.add('Canva');
    if (text.includes('photoshop')) skills.add('Photoshop');
    if (text.includes('figma')) skills.add('Figma');
    skills.add('Graphic Design');
  } else if (text.includes('python') || text.includes('debug') || text.includes('code') || text.includes('react') || text.includes('javascript') || text.includes('fastapi') || text.includes('bug')) {
    category = 'Tech/Coding';
    if (text.includes('python')) skills.add('Python');
    if (text.includes('react')) skills.add('React');
    if (text.includes('debug') || text.includes('bug')) skills.add('Debugging');
    skills.add('Web Development');
  } else if (text.includes('notes') || text.includes('dbms') || text.includes('ppt') || text.includes('presentation') || text.includes('assignment') || text.includes('lecture')) {
    category = 'Academics';
    if (text.includes('notes')) skills.add('Study Notes');
    if (text.includes('dbms')) skills.add('DBMS');
    if (text.includes('ppt') || text.includes('presentation')) skills.add('PPT Presentation');
  } else if (text.includes('deliver') || text.includes('pickup') || text.includes('drop') || text.includes('xerox') || text.includes('manual')) {
    category = 'Delivery';
    skills.add('Delivery');
    skills.add('Campus Navigation');
  } else if (text.includes('photo') || text.includes('camera') || text.includes('video') || text.includes('shoot') || text.includes('reels')) {
    category = 'Media';
    if (text.includes('video')) skills.add('Video Editing');
    if (text.includes('photo') || text.includes('camera')) skills.add('Photography');
  } else if (text.includes('stall') || text.includes('fest') || text.includes('event') || text.includes('registration') || text.includes('crowd')) {
    category = 'Events';
    if (text.includes('stall')) skills.add('Stall Setup');
    skills.add('Event Logistics');
  }

  // Fallback skills if set is empty
  if (skills.size === 0) {
    skills.add('Campus Assistance');
  }

  // 2. Detect Budget (e.g. ₹300, 300 rupees, 300 rs, 300 inr, budget 300)
  let budget = 300; // sensible default
  const budgetMatch = text.match(/(?:₹|rs\.?|inr|budget\s*(?:of|is)?\s*[:=]?)\s*(\d{2,5})/i) ||
                      text.match(/(\d{2,5})\s*(?:₹|rupees|rs|bucks)/i);
  if (budgetMatch && budgetMatch[1]) {
    budget = parseInt(budgetMatch[1], 10);
  }

  // 3. Detect Deadline & Urgency
  let deadline = 'Tomorrow, 6:00 PM';
  let urgency: ExtractedGigRequirements['urgency'] = 'Normal';

  if (text.includes('asap') || text.includes('urgent') || text.includes('right now') || text.includes('within 1 hour') || text.includes('in 2 hours')) {
    urgency = 'Urgent';
    deadline = 'Within 2 hours';
  } else if (text.includes('today')) {
    deadline = 'Today, 8:00 PM';
  } else if (text.includes('tomorrow')) {
    deadline = 'Tomorrow, 6:00 PM';
  } else if (text.includes('weekend')) {
    deadline = 'This Weekend';
  }

  // 4. Detect Location
  let locationName = 'Block B (Tech Hub)';
  let latitude = 28.5448;
  let longitude = 77.1935;

  for (const [key, loc] of Object.entries(CAMPUS_LOCATIONS)) {
    if (text.includes(key)) {
      locationName = loc.name;
      latitude = loc.lat;
      longitude = loc.lon;
      break;
    }
  }

  // 5. Generate concise Title
  let title = prompt.trim();
  if (title.length > 50) {
    // Generate clean concise title based on category & skills
    const firstSkill = Array.from(skills)[0] || 'Campus Task';
    title = `${firstSkill} Needed at ${locationName.split(' ')[0]}`;
  }

  return {
    title,
    category,
    skills: Array.from(skills),
    budget,
    deadline,
    urgency,
    locationName,
    latitude,
    longitude,
    confidence: 0.94
  };
}
