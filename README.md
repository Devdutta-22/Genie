# Genie (Gully Gigs) 🎓⚡
> **Hyper-Local Campus Micro-Gig Platform**  
> *"Your Campus. Your Gigs."*

---

## 🌟 Overview

**Gully Gigs** is a hyper-local micro-gig marketplace designed specifically for college campuses. It intelligently connects students who need quick tasks done (posters, PPTs, Python debugging, event help, document delivery, notes) with nearby students who have the required skills and availability.

Instead of spamming WhatsApp or Telegram groups, Gully Gigs replaces chaotic ad-hoc messaging with an intelligent campus platform featuring **candidate discovery, hybrid score matching, proximity-based notification waves, atomic race-condition acceptance, real-time chat, and verified campus reputation.**

---

## 🚀 Key Features

### 1. 🎯 Intelligent Hybrid Matching Algorithm
Calculates a deterministic 0–100 composite match score before notifying candidates:
```
Match Score =
    (Skill Relevance  × 40%)
  + (Distance Score   × 30%)
  + (Availability     × 15%)
  + (Rating / History × 10%)
  + (Reliability Rate ×  5%)
```
- **Semantic Skill Clusters**: Matches not just exact strings, but related capabilities (e.g., *Canva ↔ Graphic Design ↔ Photoshop ↔ Figma*).
- **Haversine Distance**: Accurate distance on campus measured in meters.

### 2. 📡 Proximity-Based Notification Escalation (Waves)
Rather than broadcasting to thousands of students simultaneously, notifications escalate in waves:
- **Wave 1 (0 – 500m)**: Top matching students in the same or adjacent block.
- **Wave 2 (500m – 1km)**: Expanded walking radius.
- **Wave 3 (1km – 2km)**: Hostels, sports grounds, and outer campus zones.
- **Wave 4 (Campus-Wide)**: Fallback pool for maximum reach.

### 3. 🪄 AI Requirement Extraction
Students can describe their task in plain natural language (e.g. *"Need someone nearby who knows Canva to make a poster by tomorrow. Budget ₹300 at Block B"*). The AI extractor parses:
- Task Category
- Required Skills
- Budget & Fee Breakdown
- Campus Location & Coordinates
- Deadline & Urgency

### 4. 🔒 Atomic Acceptance & Race Condition Protection
Prevents duplicate assignments when two students tap "Accept" simultaneously. Uses atomic SQLite database row state transitions to ensure only the first valid request succeeds, gracefully alerting other applicants with a polite conflict message.

### 5. 🗺️ Interactive Campus Map (Leaflet)
- Geo-tagged gig markers with category badges and urgency indicators.
- Live student position with pulsating radar pin.
- Visual proximity circles (500m / 1km radius).
- Walk Simulation pills to test changing locations across campus blocks.

### 6. 💬 In-App Task Workspace & Live Chat
- Real-time chat between Poster and Worker for coordination.
- Lifecycle Stepper: `ASSIGNED` ➔ `IN_PROGRESS` ➔ `SUBMITTED` ➔ `COMPLETED` ➔ `CLOSED`.
- Submission links (Drive, Canva, GitHub) & delivery notes.
- Instant campus escrow release receipt.

### 7. ⭐ Verified Student Reputation System
- Mutual rating & review on 3 key vectors: **Communication, Quality, and Reliability**.
- Live reputation profile displaying completion rate, response rate, and verified student status.

### 8. 👥 Multi-Persona Switcher
Test both sides of the marketplace seamlessly with pre-seeded campus personas:
- **Aman Verma (Poster)**: Tech Fest organizer (Hostel 4).
- **Rahul Sharma (Worker)**: B.Tech CSE 3rd Year, skilled in Python, React, Photoshop, Canva (Rating 4.8).
- **Priya Nair (Worker/Poster)**: B.Des 2nd Year, UI/UX & Graphic Design (Rating 4.9).
- **Arjun Patel (Worker)**: Event logistics & stage setup (Rating 4.7).
- **Sneha Rao (Worker)**: DBMS expert & academic notes (Rating 4.9).

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Leaflet
- **Backend**: Node.js v26, Express, `node:sqlite` (native built-in SQLite with WAL mode), WebSockets (`ws`)
- **API**: REST + Real-time WebSocket pub/sub for instant gig alerts & chat

---

## 🏁 Quick Start

### 1. Install Dependencies
```bash
npm install
cd client && npm install && cd ..
```

### 2. Run the Full Stack App
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5001/api/health](http://localhost:5001/api/health)
- **WebSocket**: `ws://localhost:5001/ws`

---

## 📂 Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx             # Campus branding & persona switcher
│   │   │   ├── GigFeed.tsx            # Nearby gig discovery feed & filters
│   │   │   ├── CampusMap.tsx          # Leaflet map with proximity circles
│   │   │   ├── PostGigModal.tsx       # Create gig with AI natural language extraction
│   │   │   ├── GigDetailModal.tsx     # Gig view & atomic acceptance guard
│   │   │   ├── MatchingInspector.tsx  # Algorithm visualizer & wave escalation
│   │   │   ├── ActiveGigWorkspace.tsx # Live chat, stepper, submission & payments
│   │   │   ├── ProfileView.tsx        # Reputation, metrics & peer reviews
│   │   │   └── NotificationDrawer.tsx # Wave notifications & alert cards
│   │   ├── services/
│   │   │   └── api.ts                 # REST and WebSocket client
│   │   ├── types.ts                   # Domain models
│   │   ├── App.tsx                    # Main state machine
│   │   └── index.css                  # Tailwind and Leaflet styling
├── server/
│   ├── src/
│   │   ├── db.ts                      # node:sqlite initialization & campus seed data
│   │   ├── matching.ts                # Hybrid scoring & Haversine distance engine
│   │   ├── aiExtractor.ts             # Natural language requirement extractor
│   │   ├── routes/
│   │   │   ├── users.ts               # Student profile routes
│   │   │   ├── gigs.ts                # Gigs, waves & atomic acceptance
│   │   │   ├── messages.ts            # Chat messages
│   │   │   ├── ratings.ts             # Mutual reviews & reputation scoring
│   │   │   └── notifications.ts       # Student alert inboxes
│   │   └── index.ts                   # Express server & WebSocket broadcaster
└── package.json
```

---

## 📄 License
MIT © Gully Gigs Team
