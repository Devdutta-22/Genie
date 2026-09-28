import express from 'express';
import cors from 'cors';
import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { initDatabase } from './db.ts';
import { usersRouter } from './routes/users.ts';
import { gigsRouter } from './routes/gigs.ts';
import { messagesRouter } from './routes/messages.ts';
import { ratingsRouter } from './routes/ratings.ts';
import { notificationsRouter } from './routes/notifications.ts';

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize Database & Seeds
initDatabase();

app.use(cors());
app.use(express.json());

// Create HTTP server & WebSocket server
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Connected to Gully Gigs Live Server' }));

  ws.on('close', () => {
    clients.delete(ws);
  });
});

export function broadcastWsEvent(type: string, data: any) {
  const payload = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (err) {
        console.error('Error broadcasting ws event:', err);
      }
    }
  }
}

// Register API routes
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

server.listen(PORT, () => {
  console.log(`🚀 Gully Gigs Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready at ws://localhost:${PORT}/ws`);
});
