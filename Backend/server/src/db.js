/**
 * ============================================================================
 * GENIE BACKEND - DATABASE LAYER (Prisma 8 / PostgreSQL)
 * ============================================================================
 * 
 * This module serves as the primary database interface for the entire backend.
 * 
 * Architecture & Design:
 * 1. Single Source of Truth:
 *    All PostgreSQL database interactions go through Prisma 8 using the
 *    @prisma/orm-postgres driver initialized in `./db.prisma.js`.
 * 2. Multi-Schema Architecture:
 *    The PostgreSQL database is organized into 9 distinct domain schemas:
 *    - campus        -> campuses, campus_hours, locations
 *    - core          -> users, user_profiles, skills, user_skills, user_availability
 *    - marketplace   -> categories, gigs, gig_skill_requirements, gig_attachments,
 *                       gig_claims, gig_events, gig_status_history
 *    - matching      -> matching_preferences, match_results, match_feedback
 *    - communication -> conversations, conversation_participants, messages
 *    - notification  -> notifications, notification_deliveries, notification_preferences
 *    - payment       -> wallets, wallet_transactions, gig_payments, payouts, refunds
 *    - reputation    -> ratings, reputation_history
 *    - security      -> user_blocks, reports, moderation_actions, audit_logs
 * 3. Supabase Auth Integration:
 *    Supabase Auth manages user credentials in `auth.users`. When a user record
 *    is inserted into `auth.users`, a database trigger (`core.handle_new_user`)
 *    automatically provisions the corresponding `core.users` application user.
 * 4. Backward Compatibility:
 *    Exports `db` as both default and named export `{ db }` so all existing route
 *    modules can import the database cleanly.
 * ============================================================================
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

// Resolve project root .env directory reliably across different execution contexts
const __dirname = path.dirname(fileURLToPath(import.meta.url));
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}

// Import working Prisma 8 PostgreSQL database client
import db from './db.prisma.js';

// Dedicated pg Pool for raw SQL queries on system schemas (such as auth.users)
// when handling authentication triggers and raw aggregations
export const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

/**
 * Ensures the default campus exists in campus.campuses.
 * Default: Galgotias University (code: GU, Greater Noida)
 */
async function ensureDefaultCampus() {
  try {
    let campus = await db.orm.campus.Campus.where({ code: 'GU' }).first();
    if (!campus) {
      campus = await db.orm.campus.Campus.create({
        name: 'Galgotias University',
        code: 'GU',
        universityName: 'Galgotias University',
        city: 'Greater Noida',
        state: 'Uttar Pradesh',
        country: 'India',
        timezone: 'Asia/Kolkata',
        isActive: true,
      });
      console.log('🏫 Created default campus: Galgotias University (GU)');
    }
    return campus;
  } catch (err) {
    console.warn('⚠️ Could not verify/seed default campus:', err.message);
    return null;
  }
}

/**
 * Ensures standard gig categories exist in marketplace.categories.
 */
async function ensureDefaultCategories() {
  const defaultCategories = [
    { name: 'Design', description: 'Canva, Figma, Posters, Graphics & Branding' },
    { name: 'Coding', description: 'Web Dev, Python, Debugging, Scripting & Technical Tasks' },
    { name: 'Academics', description: 'Notes, Tutoring, PPT Presentations & Exam Prep' },
    { name: 'Events', description: 'Logistics, Stall Setup, Volunteering & Coordination' },
    { name: 'Delivery', description: 'On-campus pickup, printout delivery & urgent errands' },
    { name: 'Media', description: 'Photography, Video Editing, Reels & Audio' },
  ];

  try {
    for (const cat of defaultCategories) {
      const existing = await db.orm.marketplace.Category.where({ name: cat.name }).first();
      if (!existing) {
        await db.orm.marketplace.Category.create({
          name: cat.name,
          description: cat.description,
          isActive: true,
        });
      }
    }
  } catch (err) {
    console.warn('⚠️ Could not verify/seed default categories:', err.message);
  }
}

/**
 * Initializes the database connection and verifies connectivity to Supabase PostgreSQL.
 * Logs active database status and ensures essential seed metadata is present.
 */
export async function initDatabase() {
  console.log('🔄 Initializing Prisma 8 PostgreSQL database connection...');
  try {
    // Ping database by fetching or ensuring campus
    const campus = await ensureDefaultCampus();
    await ensureDefaultCategories();

    const users = await db.orm.core.User.all();
    const userCount = users.length;
    console.log(`✅ Supabase PostgreSQL connected via Prisma 8! (Users in database: ${userCount})`);
    if (campus) {
      console.log(`📍 Campus context: ${campus.name} [ID: ${campus.id}]`);
    }
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
  }
}

export { db };
export default db;
