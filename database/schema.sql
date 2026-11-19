-- ============================================================
-- GENIE DATABASE - FINAL PRODUCTION SCHEMA
-- ============================================================
--
-- Project: Genie
-- Purpose: Campus-based micro-gig marketplace
--
-- IMPORTANT:
-- 1. Supabase Auth manages login/password/OTP credentials.
-- 2. auth.users is the source of truth for authentication.
-- 3. core.users stores application-level user information.
-- 4. Separate PostgreSQL schemas organize different domains.
-- 5. PostGIS is used for location and nearby matching.
--
-- DATABASE DOMAINS
--
-- core          -> users, profiles, skills, availability
-- campus        -> campuses and physical locations
-- marketplace   -> gigs and gig lifecycle
-- matching      -> matching engine data
-- communication -> chat and conversations
-- notification  -> notifications
-- reputation    -> ratings and trust
-- payment       -> wallet/payment/payout records
-- security      -> reports, blocks, moderation and auditing
--
-- ============================================================


-- ============================================================
-- 0. CLEAN APPLICATION SCHEMAS
-- ============================================================
--
-- This does NOT delete Supabase's auth/storage/realtime systems.
-- It only resets Genie application schemas.
--
-- Use this ONLY because this is currently a fresh project.
-- ============================================================

DROP SCHEMA IF EXISTS security CASCADE;
DROP SCHEMA IF EXISTS payment CASCADE;
DROP SCHEMA IF EXISTS reputation CASCADE;
DROP SCHEMA IF EXISTS notification CASCADE;
DROP SCHEMA IF EXISTS communication CASCADE;
DROP SCHEMA IF EXISTS matching CASCADE;
DROP SCHEMA IF EXISTS marketplace CASCADE;
DROP SCHEMA IF EXISTS campus CASCADE;
DROP SCHEMA IF EXISTS core CASCADE;


-- ============================================================
-- 1. CREATE APPLICATION SCHEMAS
-- ============================================================

CREATE SCHEMA core;
CREATE SCHEMA campus;
CREATE SCHEMA marketplace;
CREATE SCHEMA matching;
CREATE SCHEMA communication;
CREATE SCHEMA notification;
CREATE SCHEMA reputation;
CREATE SCHEMA payment;
CREATE SCHEMA security;


-- ============================================================
-- 2. CORE
-- ============================================================

-- ------------------------------------------------------------
-- CORE USERS
-- ------------------------------------------------------------
-- Links application user to Supabase authenticated user.
--
-- auth.users.id
--       │
--       └──────> core.users.id
--
-- NEVER store passwords here.
-- ------------------------------------------------------------

CREATE TABLE core.users (
    id UUID PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    university_id TEXT NOT NULL UNIQUE,

    email TEXT NOT NULL UNIQUE,

    phone TEXT,

    role TEXT NOT NULL DEFAULT 'STUDENT'
        CHECK (role IN ('STUDENT', 'ADMIN', 'MODERATOR')),

    verification_status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (
            verification_status IN
            ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED')
        ),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    trust_score NUMERIC(5,2) NOT NULL DEFAULT 50
        CHECK (trust_score >= 0 AND trust_score <= 100),

    last_login_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- USER PROFILES
-- ------------------------------------------------------------
-- Additional profile information.
-- Kept separate from authentication and core user identity.
-- ------------------------------------------------------------

CREATE TABLE core.user_profiles (
    user_id UUID PRIMARY KEY
        REFERENCES core.users(id)
        ON DELETE CASCADE,

    full_name TEXT NOT NULL,

    username TEXT UNIQUE,

    bio TEXT,

    avatar_url TEXT,

    department TEXT,

    course TEXT,

    year_of_study INTEGER
        CHECK (year_of_study BETWEEN 1 AND 6),

    skills_summary TEXT,

    rating_average NUMERIC(3,2) DEFAULT 0
        CHECK (rating_average >= 0 AND rating_average <= 5),

    total_gigs_completed INTEGER NOT NULL DEFAULT 0
        CHECK (total_gigs_completed >= 0),

    total_gigs_posted INTEGER NOT NULL DEFAULT 0
        CHECK (total_gigs_posted >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- SKILLS
-- ------------------------------------------------------------
-- Master list of skills.
--
-- Examples:
-- Python
-- Java
-- React
-- Graphic Design
-- Video Editing
-- PPT Creation
-- Event Management
-- ------------------------------------------------------------

CREATE TABLE core.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL UNIQUE,

    category TEXT,

    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- USER SKILLS
-- ------------------------------------------------------------
-- Many-to-many relationship:
--
-- One user -> many skills
-- One skill -> many users
-- ------------------------------------------------------------

CREATE TABLE core.user_skills (
    user_id UUID NOT NULL
        REFERENCES core.users(id)
        ON DELETE CASCADE,

    skill_id UUID NOT NULL
        REFERENCES core.skills(id)
        ON DELETE CASCADE,

    proficiency_level INTEGER NOT NULL DEFAULT 3
        CHECK (proficiency_level BETWEEN 1 AND 5),

    years_experience NUMERIC(4,1)
        CHECK (years_experience >= 0),

    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, skill_id)
);


-- ------------------------------------------------------------
-- USER AVAILABILITY
-- ------------------------------------------------------------
-- Stores when a student is generally available for gigs.
-- ------------------------------------------------------------

CREATE TABLE core.user_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES core.users(id)
        ON DELETE CASCADE,

    day_of_week INTEGER NOT NULL
        CHECK (day_of_week BETWEEN 0 AND 6),

    start_time TIME,

    end_time TIME,

    is_available BOOLEAN NOT NULL DEFAULT TRUE,

    UNIQUE(user_id, day_of_week)
);


-- ============================================================
-- 3. CAMPUS
-- ============================================================

-- ------------------------------------------------------------
-- CAMPUSES
-- ------------------------------------------------------------

CREATE TABLE campus.campuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,

    code TEXT NOT NULL UNIQUE,

    university_name TEXT,

    city TEXT,

    state TEXT,

    country TEXT DEFAULT 'India',

    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- CAMPUS HOURS
-- ------------------------------------------------------------

CREATE TABLE campus.campus_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    campus_id UUID NOT NULL
        REFERENCES campus.campuses(id)
        ON DELETE CASCADE,

    day_of_week INTEGER NOT NULL
        CHECK (day_of_week BETWEEN 0 AND 6),

    opens_at TIME,

    closes_at TIME,

    is_closed BOOLEAN NOT NULL DEFAULT FALSE,

    UNIQUE(campus_id, day_of_week)
);


-- ------------------------------------------------------------
-- CAMPUS LOCATIONS
-- ------------------------------------------------------------
-- Stores buildings, gates, hostels, classrooms, etc.
--
-- PostGIS geography point allows:
--
-- "Find gigs within 500 metres."
--
-- ------------------------------------------------------------

CREATE TABLE campus.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    campus_id UUID NOT NULL
        REFERENCES campus.campuses(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,

    type TEXT NOT NULL
        CHECK (
            type IN (
                'GATE',
                'BUILDING',
                'HOSTEL',
                'CLASSROOM',
                'LIBRARY',
                'CAFETERIA',
                'OFFICE',
                'LAB',
                'GROUND',
                'PARKING',
                'OTHER'
            )
        ),

    building_code TEXT,

    floor TEXT,

    room TEXT,

    latitude DOUBLE PRECISION NOT NULL,

    longitude DOUBLE PRECISION NOT NULL,

    location GEOGRAPHY(POINT, 4326),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 4. MARKETPLACE
-- ============================================================

-- ------------------------------------------------------------
-- GIG CATEGORIES
-- ------------------------------------------------------------

CREATE TABLE marketplace.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL UNIQUE,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- GIGS
-- ------------------------------------------------------------
-- Main marketplace table.
--
-- A requester creates a gig.
-- A worker claims it.
-- Gig then moves through lifecycle states.
-- ------------------------------------------------------------

CREATE TABLE marketplace.gigs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    campus_id UUID NOT NULL
        REFERENCES campus.campuses(id),

    requester_id UUID NOT NULL
        REFERENCES core.users(id),

    category_id UUID
        REFERENCES marketplace.categories(id),

    title TEXT NOT NULL,

    description TEXT NOT NULL,

    urgency TEXT NOT NULL DEFAULT 'NORMAL'
        CHECK (
            urgency IN
            ('LOW', 'NORMAL', 'HIGH', 'URGENT')
        ),

    reward NUMERIC(10,2) NOT NULL
        CHECK (reward > 0),

    currency TEXT NOT NULL DEFAULT 'INR',

    status TEXT NOT NULL DEFAULT 'OPEN'
        CHECK (
            status IN (
                'DRAFT',
                'OPEN',
                'ASSIGNED',
                'IN_PROGRESS',
                'SUBMITTED',
                'COMPLETED',
                'CANCELLED',
                'EXPIRED',
                'CLOSED'
            )
        ),

    pickup_location_id UUID
        REFERENCES campus.locations(id),

    drop_location_id UUID
        REFERENCES campus.locations(id),

    pickup_latitude DOUBLE PRECISION,

    pickup_longitude DOUBLE PRECISION,

    drop_latitude DOUBLE PRECISION,

    drop_longitude DOUBLE PRECISION,

    scheduled_pickup_at TIMESTAMPTZ,

    deadline_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- GIG SKILL REQUIREMENTS
-- ------------------------------------------------------------
-- A gig can require multiple skills.
-- ------------------------------------------------------------

CREATE TABLE marketplace.gig_skill_requirements (
    gig_id UUID NOT NULL
        REFERENCES marketplace.gigs(id)
        ON DELETE CASCADE,

    skill_id UUID NOT NULL
        REFERENCES core.skills(id)
        ON DELETE CASCADE,

    required_level INTEGER DEFAULT 1
        CHECK (required_level BETWEEN 1 AND 5),

    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,

    PRIMARY KEY (gig_id, skill_id)
);


-- ------------------------------------------------------------
-- GIG ATTACHMENTS
-- ------------------------------------------------------------

CREATE TABLE marketplace.gig_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    gig_id UUID NOT NULL
        REFERENCES marketplace.gigs(id)
        ON DELETE CASCADE,

    uploaded_by UUID NOT NULL
        REFERENCES core.users(id),

    file_name TEXT NOT NULL,

    file_url TEXT NOT NULL,

    file_type TEXT,

    file_size_bytes BIGINT
        CHECK (file_size_bytes >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- GIG CLAIMS
-- ------------------------------------------------------------
-- Critical table for preventing two users from claiming
-- the same gig.
--
-- One gig can have only ONE active claim.
-- ------------------------------------------------------------

CREATE TABLE marketplace.gig_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    gig_id UUID NOT NULL UNIQUE
        REFERENCES marketplace.gigs(id)
        ON DELETE CASCADE,

    worker_id UUID NOT NULL
        REFERENCES core.users(id),

    status TEXT NOT NULL DEFAULT 'ACTIVE'
        CHECK (
            status IN
            ('ACTIVE', 'CANCELLED', 'COMPLETED')
        ),

    claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    started_at TIMESTAMPTZ,

    completed_at TIMESTAMPTZ,

    cancelled_at TIMESTAMPTZ
);


-- ------------------------------------------------------------
-- GIG EVENTS
-- ------------------------------------------------------------
-- Complete timeline of important gig events.
-- Useful for debugging and auditing.
-- ------------------------------------------------------------

CREATE TABLE marketplace.gig_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    gig_id UUID NOT NULL
        REFERENCES marketplace.gigs(id)
        ON DELETE CASCADE,

    event_type TEXT NOT NULL,

    actor_id UUID
        REFERENCES core.users(id),

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- GIG STATUS HISTORY
-- ------------------------------------------------------------
-- Records every status transition.
-- ------------------------------------------------------------

CREATE TABLE marketplace.gig_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    gig_id UUID NOT NULL
        REFERENCES marketplace.gigs(id)
        ON DELETE CASCADE,

    from_status TEXT,

    to_status TEXT NOT NULL,

    changed_by UUID
        REFERENCES core.users(id),

    reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 5. MATCHING
-- ============================================================

-- ------------------------------------------------------------
-- MATCHING PREFERENCES
-- ------------------------------------------------------------

CREATE TABLE matching.matching_preferences (
    user_id UUID PRIMARY KEY
        REFERENCES core.users(id)
        ON DELETE CASCADE,

    max_distance_meters INTEGER DEFAULT 2000
        CHECK (max_distance_meters > 0),

    minimum_rating NUMERIC(3,2) DEFAULT 0
        CHECK (minimum_rating BETWEEN 0 AND 5),

    preferred_categories JSONB DEFAULT '[]'::jsonb,

    preferred_skills JSONB DEFAULT '[]'::jsonb,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- MATCH RESULTS
-- ------------------------------------------------------------
-- Stores generated candidate matches.
--
-- Score components:
-- skill relevance
-- distance
-- availability
-- rating/history
-- reliability
-- ------------------------------------------------------------

CREATE TABLE matching.match_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    gig_id UUID NOT NULL
        REFERENCES marketplace.gigs(id)
        ON DELETE CASCADE,

    worker_id UUID NOT NULL
        REFERENCES core.users(id)
        ON DELETE CASCADE,

    total_score NUMERIC(6,3) NOT NULL
        CHECK (total_score >= 0),

    skill_score NUMERIC(6,3) DEFAULT 0,

    distance_score NUMERIC(6,3) DEFAULT 0,

    availability_score NUMERIC(6,3) DEFAULT 0,

    rating_score NUMERIC(6,3) DEFAULT 0,

    reliability_score NUMERIC(6,3) DEFAULT 0,

    distance_meters DOUBLE PRECISION,

    rank INTEGER,

    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(gig_id, worker_id)
);


-- ------------------------------------------------------------
-- MATCH FEEDBACK
-- ------------------------------------------------------------
-- Used to improve the matching system later.
-- ------------------------------------------------------------

CREATE TABLE matching.match_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    match_result_id UUID NOT NULL
        REFERENCES matching.match_results(id)
        ON DELETE CASCADE,

    worker_id UUID
        REFERENCES core.users(id),

    feedback_type TEXT NOT NULL
        CHECK (
            feedback_type IN (
                'ACCEPTED',
                'REJECTED',
                'IGNORED',
                'COMPLETED',
                'FAILED'
            )
        ),

    feedback_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 6. COMMUNICATION
-- ============================================================

-- ------------------------------------------------------------
-- CONVERSATIONS
-- ------------------------------------------------------------

CREATE TABLE communication.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    gig_id UUID UNIQUE
        REFERENCES marketplace.gigs(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- CONVERSATION PARTICIPANTS
-- ------------------------------------------------------------

CREATE TABLE communication.conversation_participants (
    conversation_id UUID NOT NULL
        REFERENCES communication.conversations(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES core.users(id)
        ON DELETE CASCADE,

    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    last_read_at TIMESTAMPTZ,

    PRIMARY KEY (conversation_id, user_id)
);


-- ------------------------------------------------------------
-- MESSAGES
-- ------------------------------------------------------------

CREATE TABLE communication.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    conversation_id UUID NOT NULL
        REFERENCES communication.conversations(id)
        ON DELETE CASCADE,

    sender_id UUID NOT NULL
        REFERENCES core.users(id),

    message_type TEXT NOT NULL DEFAULT 'TEXT'
        CHECK (
            message_type IN
            ('TEXT', 'IMAGE', 'FILE', 'SYSTEM')
        ),

    content TEXT,

    attachment_url TEXT,

    is_edited BOOLEAN NOT NULL DEFAULT FALSE,

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 7. NOTIFICATIONS
-- ============================================================

-- ------------------------------------------------------------
-- NOTIFICATIONS
-- ------------------------------------------------------------

CREATE TABLE notification.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES core.users(id)
        ON DELETE CASCADE,

    type TEXT NOT NULL,

    title TEXT NOT NULL,

    message TEXT NOT NULL,

    related_gig_id UUID
        REFERENCES marketplace.gigs(id)
        ON DELETE SET NULL,

    data JSONB DEFAULT '{}'::jsonb,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    read_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- NOTIFICATION DELIVERIES
-- ------------------------------------------------------------
-- Tracks whether notification was actually delivered.
-- ------------------------------------------------------------

CREATE TABLE notification.notification_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    notification_id UUID NOT NULL
        REFERENCES notification.notifications(id)
        ON DELETE CASCADE,

    channel TEXT NOT NULL
        CHECK (
            channel IN
            ('IN_APP', 'EMAIL', 'PUSH', 'SMS')
        ),

    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (
            status IN
            ('PENDING', 'SENT', 'FAILED', 'DELIVERED')
        ),

    delivered_at TIMESTAMPTZ,

    failure_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- NOTIFICATION PREFERENCES
-- ------------------------------------------------------------

CREATE TABLE notification.notification_preferences (
    user_id UUID PRIMARY KEY
        REFERENCES core.users(id)
        ON DELETE CASCADE,

    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 8. REPUTATION
-- ============================================================

-- ------------------------------------------------------------
-- RATINGS
-- ------------------------------------------------------------

CREATE TABLE reputation.ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    gig_id UUID NOT NULL
        REFERENCES marketplace.gigs(id),

    rater_id UUID NOT NULL
        REFERENCES core.users(id),

    rated_id UUID NOT NULL
        REFERENCES core.users(id),

    score INTEGER NOT NULL
        CHECK (score BETWEEN 1 AND 5),

    communication_score INTEGER
        CHECK (communication_score BETWEEN 1 AND 5),

    quality_score INTEGER
        CHECK (quality_score BETWEEN 1 AND 5),

    reliability_score INTEGER
        CHECK (reliability_score BETWEEN 1 AND 5),

    comment TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(gig_id, rater_id)
);


-- ------------------------------------------------------------
-- REPUTATION HISTORY
-- ------------------------------------------------------------
-- Keeps track of trust-score changes.
-- ------------------------------------------------------------

CREATE TABLE reputation.reputation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES core.users(id)
        ON DELETE CASCADE,

    previous_score NUMERIC(5,2),

    new_score NUMERIC(5,2) NOT NULL,

    reason TEXT NOT NULL,

    reference_id UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 9. PAYMENT
-- ============================================================

-- ------------------------------------------------------------
-- WALLETS
-- ------------------------------------------------------------

CREATE TABLE payment.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE
        REFERENCES core.users(id)
        ON DELETE CASCADE,

    available_balance NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (available_balance >= 0),

    pending_balance NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (pending_balance >= 0),

    currency TEXT NOT NULL DEFAULT 'INR',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- WALLET TRANSACTIONS
-- ------------------------------------------------------------
-- Immutable financial ledger.
-- Never simply overwrite financial history.
-- ------------------------------------------------------------

CREATE TABLE payment.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    wallet_id UUID NOT NULL
        REFERENCES payment.wallets(id),

    user_id UUID NOT NULL
        REFERENCES core.users(id),

    transaction_type TEXT NOT NULL
        CHECK (
            transaction_type IN (
                'CREDIT',
                'DEBIT',
                'HOLD',
                'RELEASE',
                'REFUND',
                'PAYOUT'
            )
        ),

    amount NUMERIC(12,2) NOT NULL
        CHECK (amount > 0),

    reference_type TEXT,

    reference_id UUID,

    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- GIG PAYMENTS
-- ------------------------------------------------------------

CREATE TABLE payment.gig_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    gig_id UUID NOT NULL UNIQUE
        REFERENCES marketplace.gigs(id),

    payer_id UUID NOT NULL
        REFERENCES core.users(id),

    payee_id UUID
        REFERENCES core.users(id),

    amount NUMERIC(12,2) NOT NULL
        CHECK (amount > 0),

    currency TEXT NOT NULL DEFAULT 'INR',

    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (
            status IN (
                'PENDING',
                'AUTHORIZED',
                'HELD',
                'RELEASED',
                'FAILED',
                'REFUNDED',
                'CANCELLED'
            )
        ),

    provider TEXT,

    provider_payment_id TEXT UNIQUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- PAYOUTS
-- ------------------------------------------------------------

CREATE TABLE payment.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES core.users(id),

    amount NUMERIC(12,2) NOT NULL
        CHECK (amount > 0),

    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (
            status IN
            ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')
        ),

    provider_payout_id TEXT UNIQUE,

    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    completed_at TIMESTAMPTZ
);


-- ------------------------------------------------------------
-- REFUNDS
-- ------------------------------------------------------------

CREATE TABLE payment.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    gig_payment_id UUID NOT NULL
        REFERENCES payment.gig_payments(id),

    amount NUMERIC(12,2) NOT NULL
        CHECK (amount > 0),

    reason TEXT,

    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (
            status IN
            ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')
        ),

    provider_refund_id TEXT UNIQUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    completed_at TIMESTAMPTZ
);


-- ============================================================
-- 10. SECURITY
-- ============================================================

-- ------------------------------------------------------------
-- USER BLOCKS
-- ------------------------------------------------------------

CREATE TABLE security.user_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    blocker_id UUID NOT NULL
        REFERENCES core.users(id)
        ON DELETE CASCADE,

    blocked_id UUID NOT NULL
        REFERENCES core.users(id)
        ON DELETE CASCADE,

    reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(blocker_id, blocked_id)
);


-- ------------------------------------------------------------
-- REPORTS
-- ------------------------------------------------------------

CREATE TABLE security.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    reporter_id UUID NOT NULL
        REFERENCES core.users(id),

    reported_user_id UUID
        REFERENCES core.users(id),

    reported_gig_id UUID
        REFERENCES marketplace.gigs(id),

    reason TEXT NOT NULL,

    description TEXT,

    status TEXT NOT NULL DEFAULT 'OPEN'
        CHECK (
            status IN
            ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED')
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    resolved_at TIMESTAMPTZ
);


-- ------------------------------------------------------------
-- MODERATION ACTIONS
-- ------------------------------------------------------------

CREATE TABLE security.moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    moderator_id UUID
        REFERENCES core.users(id),

    target_user_id UUID
        REFERENCES core.users(id),

    target_gig_id UUID
        REFERENCES marketplace.gigs(id),

    action_type TEXT NOT NULL,

    reason TEXT,

    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- AUDIT LOGS
-- ------------------------------------------------------------
-- Records sensitive system actions.
-- Useful for production debugging and security.
-- ------------------------------------------------------------

CREATE TABLE security.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    actor_id UUID
        REFERENCES core.users(id),

    action TEXT NOT NULL,

    entity_type TEXT,

    entity_id UUID,

    old_data JSONB,

    new_data JSONB,

    ip_address INET,

    user_agent TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 11. INDEXES
-- ============================================================

-- CORE

CREATE INDEX idx_users_university_id
ON core.users(university_id);

CREATE INDEX idx_users_email
ON core.users(email);

CREATE INDEX idx_users_verification
ON core.users(verification_status);

CREATE INDEX idx_user_skills_skill
ON core.user_skills(skill_id);

CREATE INDEX idx_user_availability_user
ON core.user_availability(user_id);


-- CAMPUS

CREATE INDEX idx_locations_campus
ON campus.locations(campus_id);

CREATE INDEX idx_locations_type
ON campus.locations(type);

-- IMPORTANT:
-- Spatial index for fast nearby-location queries.

CREATE INDEX idx_locations_geo
ON campus.locations
USING GIST(location);


-- MARKETPLACE

CREATE INDEX idx_gigs_campus_status
ON marketplace.gigs(campus_id, status);

CREATE INDEX idx_gigs_requester
ON marketplace.gigs(requester_id);

CREATE INDEX idx_gigs_category
ON marketplace.gigs(category_id);

CREATE INDEX idx_gigs_created
ON marketplace.gigs(created_at DESC);

CREATE INDEX idx_gigs_deadline
ON marketplace.gigs(deadline_at);

CREATE INDEX idx_gig_claims_worker
ON marketplace.gig_claims(worker_id);

CREATE INDEX idx_gig_events_gig
ON marketplace.gig_events(gig_id);

CREATE INDEX idx_gig_history_gig
ON marketplace.gig_status_history(gig_id);


-- MATCHING

CREATE INDEX idx_match_results_gig_score
ON matching.match_results(gig_id, total_score DESC);

CREATE INDEX idx_match_results_worker
ON matching.match_results(worker_id);


-- COMMUNICATION

CREATE INDEX idx_conversation_participants_user
ON communication.conversation_participants(user_id);

CREATE INDEX idx_messages_conversation
ON communication.messages(conversation_id, created_at DESC);

CREATE INDEX idx_messages_sender
ON communication.messages(sender_id);


-- NOTIFICATIONS

CREATE INDEX idx_notifications_user
ON notification.notifications(user_id, created_at DESC);

CREATE INDEX idx_notifications_unread
ON notification.notifications(user_id, is_read);


-- REPUTATION

CREATE INDEX idx_ratings_rated
ON reputation.ratings(rated_id);

CREATE INDEX idx_ratings_gig
ON reputation.ratings(gig_id);

CREATE INDEX idx_reputation_user
ON reputation.reputation_history(user_id);


-- PAYMENT

CREATE INDEX idx_wallet_transactions_user
ON payment.wallet_transactions(user_id, created_at DESC);

CREATE INDEX idx_gig_payments_payer
ON payment.gig_payments(payer_id);

CREATE INDEX idx_gig_payments_payee
ON payment.gig_payments(payee_id);

CREATE INDEX idx_payouts_user
ON payment.payouts(user_id);


-- SECURITY

CREATE INDEX idx_reports_status
ON security.reports(status);

CREATE INDEX idx_reports_reporter
ON security.reports(reporter_id);

CREATE INDEX idx_audit_actor
ON security.audit_logs(actor_id);

CREATE INDEX idx_audit_entity
ON security.audit_logs(entity_type, entity_id);


-- ============================================================
-- 12. UPDATE TIMESTAMP FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION core.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


-- ============================================================
-- 13. AUTOMATIC UPDATED_AT TRIGGERS
-- ============================================================

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON core.users
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at();


CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON core.user_profiles
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at();


CREATE TRIGGER trg_campuses_updated_at
BEFORE UPDATE ON campus.campuses
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at();


CREATE TRIGGER trg_gigs_updated_at
BEFORE UPDATE ON marketplace.gigs
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at();


CREATE TRIGGER trg_conversations_updated_at
BEFORE UPDATE ON communication.conversations
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at();


CREATE TRIGGER trg_messages_updated_at
BEFORE UPDATE ON communication.messages
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at();


CREATE TRIGGER trg_notifications_preferences_updated_at
BEFORE UPDATE ON notification.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at();


CREATE TRIGGER trg_matching_preferences_updated_at
BEFORE UPDATE ON matching.matching_preferences
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at();


CREATE TRIGGER trg_wallets_updated_at
BEFORE UPDATE ON payment.wallets
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at();


CREATE TRIGGER trg_gig_payments_updated_at
BEFORE UPDATE ON payment.gig_payments
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at();


-- ============================================================
-- 14. CREATE FIRST CAMPUS
-- ============================================================
-- Replace this information with your actual campus details.
-- ============================================================

INSERT INTO campus.campuses (
    name,
    code,
    university_name,
    city,
    state,
    country
)
VALUES (
    'Galgotias University',
    'GU',
    'Galgotias University',
    'Greater Noida',
    'Uttar Pradesh',
    'India'
);


-- ============================================================
-- 15. BASIC VERIFICATION
-- ============================================================

SELECT
    table_schema,
    table_name
FROM information_schema.tables
WHERE table_schema IN (
    'core',
    'campus',
    'marketplace',
    'matching',
    'communication',
    'notification',
    'reputation',
    'payment',
    'security'
)
ORDER BY table_schema, table_name;

-- ============================================================
-- GENIE AUTHENTICATION INTEGRATION
-- ============================================================
--
-- Supabase Auth owns authentication credentials.
-- We NEVER store passwords in Genie tables.
--
-- auth.users
--     │
--     │ same UUID
--     ▼
-- core.users
--
-- When a new Supabase Auth user is created, this trigger
-- automatically creates the corresponding Genie application user.
-- ============================================================


-- ------------------------------------------------------------
-- FUNCTION: Create Genie user after Supabase signup
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION core.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
    v_university_id TEXT;
BEGIN

    -- university_id is required by Genie.
    -- The frontend must send it during signup using:
    --
    -- options.data.university_id
    --
    v_university_id := NEW.raw_user_meta_data ->> 'university_id';

    -- Do not allow an account to be created without
    -- a university ID.
    IF v_university_id IS NULL OR trim(v_university_id) = '' THEN
        RAISE EXCEPTION 'University ID is required for Genie registration';
    END IF;


    -- Create the application-level Genie user.
    --
    -- Password is NOT stored here.
    -- Supabase Auth remains responsible for credentials.

    INSERT INTO core.users (
        id,
        university_id,
        email,
        phone,
        role,
        verification_status,
        is_active,
        trust_score
    )
    VALUES (
        NEW.id,
        trim(v_university_id),
        NEW.email,
        NEW.phone,
        'STUDENT',
        'PENDING',
        TRUE,
        50
    );

    RETURN NEW;
END;
$$;


-- ------------------------------------------------------------
-- TRIGGER: Run after a new Supabase Auth user is created
-- ------------------------------------------------------------

DROP TRIGGER IF EXISTS on_auth_user_created
ON auth.users;


CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION core.handle_new_user();


-- ============================================================
-- END AUTHENTICATION INTEGRATION
-- ============================================================