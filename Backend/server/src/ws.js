import { WebSocketServer, WebSocket } from 'ws';

export const clients = new Set();
let wssInstance = null;

export function initWebSocketServer(server) {
  wssInstance = new WebSocketServer({ server, path: '/ws' });

  wssInstance.on('connection', (ws) => {
    clients.add(ws);
    ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Connected to Gully Gigs Live Server' }));

    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  return wssInstance;
}

export function broadcastWsEvent(type, data) {
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
