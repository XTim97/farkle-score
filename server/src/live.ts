import { randomBytes } from "node:crypto";
import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocket, WebSocketServer } from "ws";

/**
 * In-memory live-scoreboard sessions. The scorer's browser is authoritative:
 * it PUTs each new game state here and the server fans it out to viewers.
 * Nothing is persisted; a restart just drops live views, not games.
 */
interface LiveSession {
  /** Latest serialized GameState pushed by the scorer, if any. */
  state: string | null;
  updatedAt: number;
  sockets: Set<WebSocket>;
}

const sessions = new Map<string, LiveSession>();

// No lookalike characters (0/O, 1/I/L): codes get read aloud across a table.
const ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789";

export function createSession(): string {
  let code: string;
  do {
    code = Array.from(randomBytes(6), (b) => ALPHABET[b % ALPHABET.length]).join("");
  } while (sessions.has(code));
  sessions.set(code, { state: null, updatedAt: Date.now(), sockets: new Set() });
  return code;
}

export function getSession(code: string): LiveSession | undefined {
  return sessions.get(code.toUpperCase());
}

export function publishState(code: string, state: string): boolean {
  const session = getSession(code);
  if (!session) return false;
  session.state = state;
  session.updatedAt = Date.now();
  for (const socket of session.sockets) {
    if (socket.readyState === WebSocket.OPEN) socket.send(state);
  }
  return true;
}

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

setInterval(() => {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [code, session] of sessions) {
    if (session.updatedAt < cutoff) {
      for (const socket of session.sockets) socket.close(1000, "session expired");
      sessions.delete(code);
    }
  }
}, 60 * 60 * 1000).unref();

const wss = new WebSocketServer({ noServer: true });
const WS_PATH = /^\/api\/live\/([A-Za-z0-9]+)\/ws$/;

/** Attach viewer WebSocket handling to the HTTP server's upgrade event. */
export function handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer): void {
  const match = WS_PATH.exec(req.url ?? "");
  const session = match?.[1] ? getSession(match[1]) : undefined;
  if (!session) {
    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    session.sockets.add(ws);
    ws.on("close", () => session.sockets.delete(ws));
    if (session.state) ws.send(session.state);
  });
}
