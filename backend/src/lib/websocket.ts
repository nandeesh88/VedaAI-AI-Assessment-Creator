import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { Server } from 'http';
import { WebSocketMessage } from '../types';

const clients = new Map<string, Set<WebSocket>>();

export function setupWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    // Extract assignmentId from query param: /ws?assignmentId=xxx
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const assignmentId = url.searchParams.get('assignmentId') || 'global';

    // Register client
    if (!clients.has(assignmentId)) {
      clients.set(assignmentId, new Set());
    }
    clients.get(assignmentId)!.add(ws);

    console.log(`[WS] Client connected for assignment: ${assignmentId}`);

    ws.on('close', () => {
      const set = clients.get(assignmentId);
      if (set) {
        set.delete(ws);
        if (set.size === 0) clients.delete(assignmentId);
      }
      console.log(`[WS] Client disconnected from assignment: ${assignmentId}`);
    });

    ws.on('error', (err) => {
      console.error('[WS] Error:', err.message);
    });

    // Send initial ack
    ws.send(JSON.stringify({ type: 'connected', assignmentId }));
  });

  return wss;
}

export function broadcastToAssignment(assignmentId: string, message: WebSocketMessage): void {
  const set = clients.get(assignmentId);
  if (!set || set.size === 0) {
    console.log(`[WS] No clients for assignment ${assignmentId}, skipping broadcast`);
    return;
  }

  const data = JSON.stringify(message);
  set.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });

  console.log(`[WS] Broadcast to ${set.size} client(s) for assignment ${assignmentId}`);
}
