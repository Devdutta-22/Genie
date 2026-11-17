import express from 'express';
import cors from 'cors';
import http from 'node:http';
import path from 'node:path';
import { initDatabase } from './db.js';
import { initWebSocketServer } from './ws.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { gigsRouter } from './routes/gigs.js';
import { messagesRouter } from './routes/messages.js';
import { ratingsRouter } from './routes/ratings.js';
import { notificationsRouter } from './routes/notifications.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize Database & Seeds
initDatabase();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.resolve('server/uploads')));

// Register API routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/gigs', gigsRouter);
app.use('/api/gigs', messagesRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/notifications', notificationsRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'Gully Gigs - Hyper-Local Campus Micro-Gig Platform',
    timestamp: new Date().toISOString()
  });
});

// Create HTTP server & WebSocket server
const server = http.createServer(app);
initWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`🚀 Gully Gigs Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready at ws://localhost:${PORT}/ws`);
});
