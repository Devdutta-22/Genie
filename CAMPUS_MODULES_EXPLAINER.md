# 📘 Gully Gigs / Genie — Plain English Architecture & Module Guide

> **What is this document?**  
> This guide explains the entire Gully Gigs (Genie) project in **simple, everyday language**. Whether you are presenting to your college professor, answering viva questions, or explaining it to a fellow student, this document breaks down what every single file and module does without confusing jargon.

---

## 🌟 1. The Big Picture (What the app does in 30 seconds)

In college, students are constantly asking for small favors on WhatsApp or Telegram:
- *"Can someone print 10 pages at Gate 2?"*
- *"Need someone who knows Canva to design an event poster by 6 PM, will pay ₹300."*
- *"Stuck on a Python error before tomorrow's lab viva, ₹200 for 30 mins help."*

**The Problem:** WhatsApp messages get lost in group chats, there is no way to know who is nearby, people ghost, and there is zero accountability.

**The Solution:** Gully Gigs is an organized, hyper-local campus marketplace.
1. A student posts a task.
2. An AI algorithm figures out the required skills, budget, and urgency.
3. The app finds the closest students who have that exact skill.
4. Notifications are sent in **waves** (first to people in your block, then walking distance, then outer hostels).
5. Once accepted, both students get a private live-chat workspace to complete the task and leave verified ratings.

---

## 🏗️ 2. High-Level Flow (How the pieces talk to each other)

```
[Student's Phone / Laptop (React)]
       │
       ├── 1. HTTP Requests (Forms, Logins, Posts)
       │    └── Express API (Node.js) ──► SQLite Database
       │
       └── 2. Live Cable Connection (WebSockets)
            └── ws.js ──► Pushes live alerts & chat messages in <10ms
```

---

## 🧩 3. Module-by-Module Breakdown (Layman's Guide)

### 🖥️ Client Modules (The Frontend / User Interface)

#### 1. `client/src/main.jsx` — "The Ignition Key"
- **In plain English:** This is the very first file that runs when someone opens the website in their browser.
- **What it does:** It grabs the `<div id="root">` on the webpage and plugs in our main React app (`App.jsx`).

#### 2. `client/src/App.jsx` — "The Brain / Traffic Controller"
- **In plain English:** Controls what screen is currently visible to the student.
- **What it does:**
  - Checks if you are logged in. If not, it shows you the login/registration screen (`AuthScreen.jsx`).
  - Keeps track of open tabs: Home Feed, Campus Map, Active Tasks, or Profile.
  - Listens to the live WebSocket server so that whenever someone posts a gig, a blue toast pop-up appears instantly.

#### 3. `client/src/components/AuthScreen.jsx` — "The Campus Gatekeeper"
- **In plain English:** The security guard at your college gate.
- **What it does:**
  - Allows existing students to sign in with email and password.
  - Allows new students to register by entering their roll number, department, year, and **uploading a photo of their College ID card**.
  - Displays **1-click quick demo buttons** so examiners/professors can test the app without typing credentials every time.

#### 4. `client/src/components/Navbar.jsx` — "The Dashboard Header"
- **In plain English:** The top navigation bar seen across every page.
- **What it does:**
  - Shows the brand logo, navigation tabs (Feed, Map, Active Tasks), notification bell badge, and "Post Request" button.
  - Shows your profile avatar with an **ID Verified 🟢** or **Verification Pending 🟡** badge.
  - Allows you to log out or switch to another student's account.

#### 5. `client/src/components/GigFeed.jsx` — "The Notice Board"
- **In plain English:** Like a digital campus notice board showing all open requests.
- **What it does:**
  - Lets students filter gigs by category (Design, Coding, Academics, Delivery, Events, Media).
  - Displays distance from the student (e.g., *"350m away"*).
  - Has a live search bar that searches by keywords, skills, or campus locations.

#### 6. `client/src/components/CampusMap.jsx` — "The Radar View"
- **In plain English:** An interactive map of the campus and surrounding areas.
- **What it does:**
  - Uses OpenStreetMap and Leaflet (completely free, zero Google API cost).
  - Puts a royal blue **"YOU"** badge where you are located.
  - Puts price tags on campus buildings where help is needed (e.g., *"₹300 at Central Library"*).
  - Clicking any pin opens the task details immediately.

#### 7. `client/src/components/CommunitySection.jsx` — "Campus Neighborhoods"
- **In plain English:** Splits the campus into 4 identifiable geographic hubs.
- **What it does:**
  - Shows cards for **Galgotias University**, **Gaur Yamuna City**, **Knowledge Park 3**, and **Supertech**.
  - Clicking any hub filters the feed to tasks in that specific area.

#### 8. `client/src/components/PostGigModal.jsx` — "The Task Creator"
- **In plain English:** The form where someone posts a request.
- **What it does:**
  - Includes a **Smart AI input**: You can simply type *"Need someone to fix Python Flask bug before 5pm, offering 250 rs"*, click **"Extract with AI"**, and the form automatically fills in the category, skills, deadline, and price!
  - Calculates fees: Poster pays the total budget, the platform takes a 5% service fee, and the student worker gets 95%.

#### 9. `client/src/components/GigDetailModal.jsx` — "The Task Inspector"
- **In plain English:** The pop-up window that opens when you tap on any gig.
- **What it does:**
  - Displays full task instructions, deadline, required skills, and poster's profile.
  - Contains the **"Accept & Start Gig"** button with built-in race-condition protection (so if two students press it at the same moment, only the faster one gets it).

#### 10. `client/src/components/ActiveGigWorkspace.jsx` — "The Work Room"
- **In plain English:** Once a task is accepted, this is the private room where the requester and the worker collaborate.
- **What it does:**
  - **Live Chat:** Real-time messaging with instant delivery.
  - **Status Steps:** Tracks progress from `Assigned` ➔ `In Progress` ➔ `Submitted` ➔ `Completed & Paid`.
  - **Submission:** Worker uploads their link or proof of work.
  - **Payment & Reviews:** Poster reviews the submission, releases payment, and leaves a 5-star rating.

#### 11. `client/src/components/ProfileView.jsx` — "The Student Resume"
- **In plain English:** Shows a student's campus reputation and credentials.
- **What it does:**
  - Displays completed tasks count, completion percentage, and star rating.
  - Lists verified skills (e.g. *Python - Expert*, *Canva - Intermediate*).
  - Displays the uploaded **College ID card** thumbnail and Roll Number for proof of student enrollment.

#### 12. `client/src/components/NotificationDrawer.jsx` — "The Inbox"
- **In plain English:** The sidebar that slides open when you click the bell icon.
- **What it does:** Lists new task alerts matching your skills with distance badges (e.g., *"New Design Task: 400m away"*).

#### 13. `client/src/components/MatchingInspector.jsx` — "The Professor's Demo Tool"
- **In plain English:** An interactive visualizer built specifically to explain the algorithm during project evaluations.
- **What it does:** Shows exactly how candidate scores (0–100) are calculated and lets you manually trigger notification waves.

#### 14. `client/src/services/api.js` — "The Messenger"
- **In plain English:** The collection of helper functions that sends requests from the browser to the backend server (like `loginUser`, `fetchGigs`, `createGig`).

---

### ⚙️ Server Modules (The Backend Engine)

#### 1. `server/src/index.js` — "The Main Server"
- **In plain English:** The entry point of the backend.
- **What it does:** Starts Express on port 5001, opens the database, starts the WebSocket server, serves uploaded ID card photos statically at `/uploads/`, and routes all incoming web requests.

#### 2. `server/src/ws.js` — "The Live Broadcaster"
- **In plain English:** The real-time notification engine.
- **What it does:** Keeps an open WebSocket connection with every active student browser. When a new gig is posted, a status changes, or a chat message is sent, `broadcastWsEvent()` pushes it to everyone instantly without needing page refreshes.

#### 3. `server/src/db.js` — "The Memory Bank"
- **In plain English:** Manages the SQLite database (`gullygigs.db`).
- **What it does:**
  - Creates the tables: `users`, `gigs`, `user_skills`, `gig_skills`, `notifications`, `messages`, `ratings`.
  - Enables **WAL mode (Write-Ahead Logging)** so the database can handle many concurrent readers and writers without crashing.
  - Seeds initial campus profiles (Rahul, Aman, Priya, Arjun, Sneha) with realistic coordinates, skills, and past reviews.

#### 4. `server/src/matching.js` — "The Matchmaker Algorithm"
- **In plain English:** The mathematical brain that pairs a task with the best students.
- **How the math works:**
  - **Skill Overlap (40%):** Matches exact skills and related skills (e.g., someone with Photoshop automatically matches a Canva request).
  - **Proximity Distance (30%):** Uses the **Haversine Formula** to compute the physical distance in meters between two GPS coordinates across campus.
  - **Availability (15%):** Checks if the student is currently marked available.
  - **Rating & History (10%):** Prioritizes students with 4.8+ stars.
  - **Reliability (5%):** Checks past completion percentage.

#### 5. `server/src/aiExtractor.js` — "The Language Translator"
- **In plain English:** Translates casual, messy student slang into clean structured database records.
- **What it does:** Scans text like *"Can someone print 4 copies of report at Gate 2 by 4pm, 150 rs"* and automatically extracts:
  - Category: `Delivery`
  - Skills: `['Delivery', 'Campus Navigation']`
  - Budget: `150`
  - Deadline: `Today, 4:00 PM`

#### 6. `server/src/routes/auth.js` — "The Registrar"
- **In plain English:** Handles student registration, login, and ID card uploads.
- **What it does:**
  - Uses `multer` to stream uploaded ID card photos directly to `/server/uploads/id_cards/`.
  - Uses `bcrypt` (10 rounds) to securely scramble passwords so passwords are never saved in plain text.
  - Issues a signed **JWT (JSON Web Token)** that allows students to stay logged in securely for 7 days.

#### 7. `server/src/routes/gigs.js` — "The Marketplace Counter"
- **In plain English:** Handles creating, viewing, and accepting tasks.
- **Key Feature — Race Condition Protection:**
  When multiple students click "Accept" at the exact same fraction of a second, an atomic database query (`UPDATE gigs SET status='ASSIGNED' WHERE id=? AND status='ACTIVE'`) guarantees that **only the first person succeeds**, and the second person receives an immediate *"Already accepted by someone else"* message.

#### 8. `server/src/routes/messages.js` — "The Chat Carrier"
- **In plain English:** Saves every chat message between requester and worker in the database and broadcasts it over WebSockets.

#### 9. `server/src/routes/ratings.js` — "The Feedback Desk"
- **In plain English:** Collects ratings (1 to 5 stars) across communication, quality, and reliability, saves written reviews, and recalculates the recipient's overall campus score.

#### 10. `server/src/routes/notifications.js` — "The Postman"
- **In plain English:** Fetches unread alerts for a student and marks them as read when clicked.

---

## 🎯 4. Viva Cheat Sheet (Quick Answers for Professors)

| Question | Your Confident Answer |
|---|---|
| **"Why is this built in pure JavaScript?"** | JavaScript runs natively in modern Node.js (v20+) and in every browser engine with zero compilation overhead, native ESM support, and instant developer agility. |
| **"Why SQLite instead of MongoDB?"** | Gigs require strict state transitions (`ACTIVE` ➔ `ASSIGNED` ➔ `COMPLETED`). Relational SQL databases provide **ACID transactions** that guarantee two students cannot claim the same gig simultaneously. MongoDB does not provide this without complex distributed locks. |
| **"Why WebSockets instead of polling?"** | HTTP polling creates enormous server overhead by sending repeated requests every few seconds even when nothing changes. WebSockets open a single persistent TCP channel that pushes updates only when an event happens, saving bandwidth and battery. |
| **"Where are ID cards stored?"** | Storing image binaries directly in the database slows down queries and bloats backups. We store the images on disk (`/server/uploads/id_cards/`) with unique randomized filenames, and store only the file path in the database. |
| **"How do notification waves work?"** | To avoid spamming 5,000 students at once, notifications escalate geographically: Wave 1 (0–500m) notifies students in the same block; Wave 2 (500m–1km) reaches walking distance; Wave 3 reaches outer hostels; Wave 4 is campus-wide fallback. |
