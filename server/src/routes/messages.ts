import express from 'express';
import type { Request, Response } from 'express';
import { db } from '../db.ts';
import { broadcastWsEvent } from '../index.ts';

const Router = express.Router;

export const messagesRouter = Router();

// GET all messages for a specific gig
messagesRouter.get('/:gigId/messages', (req: Request, res: Response) => {
  try {
    const messages = db.prepare(`
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.gig_id = ?
      ORDER BY m.timestamp ASC
    `).all(req.params.gigId);

    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST send message in gig chat
messagesRouter.post('/:gigId/messages', (req: Request, res: Response) => {
  try {
    const { sender_id, receiver_id, message } = req.body;
    if (!sender_id || !message) {
      return res.status(400).json({ error: 'sender_id and message are required' });
    }

    const id = 'msg_' + Date.now();
    const timestamp = new Date().toISOString();

    db.prepare(`
      INSERT INTO messages (id, gig_id, sender_id, receiver_id, message, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, req.params.gigId, sender_id, receiver_id || '', message, timestamp);

    const inserted = db.prepare(`
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).get(id);

    broadcastWsEvent('NEW_CHAT_MESSAGE', { gigId: req.params.gigId, message: inserted });

    res.status(201).json(inserted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
