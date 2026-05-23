import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { Server } from 'http';
import { prisma } from './prisma';
import { getMonthlyUsage } from '../middleware/rateLimit';

// ─── Message types the client can send ──────────────────────────────────────

interface AuthMessage {
  type: 'auth';
  apiKey: string;
}

interface SendMessage {
  type: 'message';
  conversationId: string;
  content: string;
  pageContext?: {
    url: string;
    title: string;
    headings: string[];
    elements: Array<{ tag: string; selector: string; text: string; type?: string }>;
    semanticSummary?: string;
  };
}

interface SubscribeMessage {
  type: 'subscribe';           // dashboard: watch a conversation for live updates
  conversationId: string;
  token: string;               // JWT — dashboard uses JWT not API key
}

type ClientMessage = AuthMessage | SendMessage | SubscribeMessage;

// ─── Per-connection state ────────────────────────────────────────────────────

interface ConnectionState {
  organizationId: string | null;
  authenticated: boolean;
  mode: 'widget' | 'dashboard' | null;
  subscribedConversationId: string | null;
}

// ─── Subscription map: conversationId → set of dashboard WebSockets ──────────
// Used to push live messages to open dashboard tabs

const subscribers = new Map<string, Set<WebSocket>>();

export function notifySubscribers(conversationId: string, payload: object) {
  const subs = subscribers.get(conversationId);
  if (!subs) return;
  const msg = JSON.stringify(payload);
  subs.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

// ─── Org-level widget connections — for pushing flow updates to live widgets ──
const orgWidgets = new Map<string, Set<WebSocket>>();

export function broadcastToOrgWidgets(orgId: string, payload: object) {
  const conns = orgWidgets.get(orgId);
  if (!conns) return;
  const msg = JSON.stringify(payload);
  conns.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

// ─── Boot the WebSocket server ────────────────────────────────────────────────

export function attachWebSocketServer(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
    const state: ConnectionState = {
      organizationId: null,
      authenticated: false,
      mode: null,
      subscribedConversationId: null,
    };
    let wsCount = 0; let wsWindow = Date.now();
    const WS_MAX = 30; const WS_WIN = 60_000;

    // Send protocol version so clients can check compatibility
    ws.send(JSON.stringify({ type: 'connected', version: '1.0' }));

    ws.on('message', async (raw) => {
      let msg: ClientMessage;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
        return;
      }

      // ── 1. Widget auth (API key) ─────────────────────────────────────────
      if (msg.type === 'auth') {
        const org = await prisma.organization.findUnique({
          where: { apiKey: msg.apiKey },
          select: { id: true },
        });
        if (!org) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid API key' }));
          ws.close();
          return;
        }
        state.organizationId = org.id;
        state.authenticated = true;
        state.mode = 'widget';
        if (!orgWidgets.has(org.id)) orgWidgets.set(org.id, new Set());
        orgWidgets.get(org.id)!.add(ws);
        ws.send(JSON.stringify({ type: 'auth_ok' }));
        return;
      }

      // ── 2. Dashboard subscribe (JWT) ─────────────────────────────────────
      if (msg.type === 'subscribe') {
        // Verify JWT inline (avoid circular import with middleware)
        try {
          const jwt = await import('jsonwebtoken');
          const payload = jwt.default.verify(msg.token, process.env.JWT_SECRET!) as { organizationId: string };

          // Make sure the conversation belongs to this org
          const conv = await prisma.conversation.findFirst({
            where: { id: msg.conversationId, organizationId: payload.organizationId },
            select: { id: true },
          });
          if (!conv) {
            ws.send(JSON.stringify({ type: 'error', message: 'Conversation not found' }));
            return;
          }

          // Register subscriber
          if (!subscribers.has(msg.conversationId)) {
            subscribers.set(msg.conversationId, new Set());
          }
          subscribers.get(msg.conversationId)!.add(ws);
          state.subscribedConversationId = msg.conversationId;
          state.mode = 'dashboard';
          ws.send(JSON.stringify({ type: 'subscribed', conversationId: msg.conversationId }));
        } catch {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
        }
        return;
      }

    });

    ws.on('close', () => {
      // Clean up dashboard subscriptions
      if (state.subscribedConversationId) {
        subscribers.get(state.subscribedConversationId)?.delete(ws);
      }
      // Clean up widget org-broadcast registration
      if (state.organizationId && state.mode === 'widget') {
        orgWidgets.get(state.organizationId)?.delete(ws);
      }
    });

    ws.on('error', (err) => {
      console.error('[ws] error:', err.message);
    });
  });

  console.log('[ws] WebSocket server attached at /ws');
  return wss;
}
