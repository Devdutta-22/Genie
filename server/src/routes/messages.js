import express from 'express';
import { db } from '../db.js';
import { broadcastWsEvent } from '../ws.js';

const Router = express.Router;
export const messagesRouter = Router();

// GET all messages for a specific gig
messagesRouter.get('/:gigId/messages', (req, res) => {
  try {
    const messages = db
      .prepare(`
        SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.gig_id = ?
        ORDER BY m.timestamp ASC
      `)
      .all(req.params.gigId);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST send message in gig chat
messagesRouter.post('/:gigId/messages', (req, res) => {
  try {
    const { sender_id, receiver_id, message } = req.body;
    if (!sender_id || !receiver_id || !message) {
      return res.status(400).json({ error: 'sender_id, receiver_id, and message are required' });
    }

    const id = 'msg_' + Date.now();
    const timestamp = new Date().toISOString();

    db.prepare(`
      INSERT INTO messages (id, gig_id, sender_id, receiver_id, message, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, req.params.gigId, sender_id, receiver_id, message, timestamp);

    const sender = db.prepare('SELECT name, avatar FROM users WHERE id = ?').get(sender_id);

    const savedMessage = {
      id,
      gig_id: req.params.gigId,
      sender_id,
      receiver_id,
      message,
      timestamp,
      sender_name: sender ? sender.name : 'Student',
      sender_avatar: sender ? sender.avatar : ''
    };

    broadcastWsEvent('NEW_MESSAGE', savedMessage);
    res.status(201).json(savedMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
