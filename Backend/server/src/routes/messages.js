/**
 * ============================================================================
 * MESSAGES ROUTER (Prisma 8 / PostgreSQL Communication Schema)
 * ============================================================================
 * 
 * PostgreSQL Schemas & Tables Used:
 * 1. communication.conversations:
 *    - Represents a chat room linked 1-to-1 to a marketplace gig.
 * 2. communication.conversation_participants:
 *    - Tracks participating students (requester and assigned worker).
 * 3. communication.messages:
 *    - Stores individual chat messages, timestamps, and edit/delete status.
 * 4. core.user_profiles:
 *    - Supplies display names and avatars for message senders.
 * ============================================================================
 */

import express from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { broadcastWsEvent } from '../ws.js';

export const messagesRouter = express.Router();

/**
 * Finds an existing conversation for a gig or creates a new one.
 */
async function getOrCreateConversation(gigId, senderId, receiverId) {
  let conversation = await db.orm.communication.Conversation.where({ gigId }).first();

  if (!conversation) {
    const conversationId = crypto.randomUUID();
    conversation = await db.orm.communication.Conversation.create({
      id: conversationId,
      gigId,
    });

    // Add participants
    const participants = [senderId, receiverId].filter(Boolean);
    for (const userId of participants) {
      try {
        await db.orm.communication.ConversationParticipant.create({
          conversationId,
          userId,
        });
      } catch (e) {}
    }
  }

  return conversation;
}

// ============================================================================
// GET /api/gigs/:gigId/messages - Retrieve all chat messages for a gig thread
// ============================================================================
messagesRouter.get('/:gigId/messages', async (req, res) => {
  try {
    const { gigId } = req.params;

    // 1. Locate conversation linked to this gig
    const conversation = await db.orm.communication.Conversation.where({ gigId }).first();
    if (!conversation) {
      return res.json([]);
    }

    // 2. Fetch all messages in this conversation
    const messages = await db.orm.communication.Message.where({
      conversationId: conversation.id
    }).all();

    // 3. Fetch sender profiles from core.user_profiles for sender_name and avatar
    const profiles = await db.orm.core.UserProfile.all();
    const profileMap = new Map(profiles.map((p) => [p.userId, p]));

    // Sort by createdAt ascending
    messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const formatted = messages.map((m) => {
      const sender = profileMap.get(m.senderId);
      return {
        id: m.id,
        gig_id: gigId,
        conversation_id: m.conversationId,
        sender_id: m.senderId,
        message: m.content || '',
        content: m.content || '',
        message_type: m.messageType,
        timestamp: m.createdAt,
        created_at: m.createdAt,
        sender_name: sender ? sender.fullName : 'Student',
        sender_avatar: sender ? sender.avatarUrl : ''
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching gig messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// POST /api/gigs/:gigId/messages - Send a message in a gig thread
// ============================================================================
messagesRouter.post('/:gigId/messages', async (req, res) => {
  try {
    const { gigId } = req.params;
    const { sender_id, receiver_id, message } = req.body;

    if (!sender_id || !message) {
      return res.status(400).json({ error: 'sender_id and message are required' });
    }

    // 1. Ensure conversation exists for this gig
    const conversation = await getOrCreateConversation(gigId, sender_id, receiver_id);

    // 2. Insert message into communication.messages
    const messageId = crypto.randomUUID();
    const createdMessage = await db.orm.communication.Message.create({
      id: messageId,
      conversationId: conversation.id,
      senderId: sender_id,
      content: message.trim(),
      messageType: 'TEXT',
      isEdited: false,
      isDeleted: false
    });

    // 3. Update conversation updatedAt
    await db.orm.communication.Conversation.where({ id: conversation.id }).update({
      updatedAt: new Date()
    });

    // 4. Fetch sender profile
    const sender = await db.orm.core.UserProfile.where({ userId: sender_id }).first();

    const savedMessage = {
      id: createdMessage.id,
      gig_id: gigId,
      conversation_id: conversation.id,
      sender_id,
      receiver_id: receiver_id || null,
      message: message.trim(),
      content: message.trim(),
      timestamp: createdMessage.createdAt,
      created_at: createdMessage.createdAt,
      sender_name: sender ? sender.fullName : 'Student',
      sender_avatar: sender ? sender.avatarUrl : ''
    };

    // Broadcast real-time message event via WebSocket
    broadcastWsEvent('NEW_MESSAGE', savedMessage);

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});
