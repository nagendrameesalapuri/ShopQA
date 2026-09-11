const { WebSocketServer } = require("ws");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../middleware/auth");

// Live order-status updates over WebSocket: when an admin changes an
// order's status (PUT /api/orders/admin/:id/status), the owning customer's
// Order Detail page updates in real time instead of requiring a refresh —
// a realistic scenario for practicing page.waitForEvent('websocket') and
// multi-tab/multi-context Playwright tests (admin tab mutates, customer
// tab observes the push).
//
// Auth: the browser WebSocket API can't send custom headers, so the JWT is
// passed as a query param (?token=...) and verified the same way the HTTP
// authenticate() middleware does.

let wss;
// userId -> Set<WebSocket>
const clientsByUser = new Map();

const attach = (server) => {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    let userId = null;
    if (token) {
      try {
        userId = jwt.verify(token, JWT_SECRET).id;
      } catch {
        ws.close(4001, "Invalid token");
        return;
      }
    } else {
      ws.close(4001, "Token required");
      return;
    }

    if (!clientsByUser.has(userId)) clientsByUser.set(userId, new Set());
    clientsByUser.get(userId).add(ws);

    ws.send(JSON.stringify({ type: "connected", userId }));

    ws.on("close", () => {
      clientsByUser.get(userId)?.delete(ws);
      if (clientsByUser.get(userId)?.size === 0) clientsByUser.delete(userId);
    });
  });

  return wss;
};

const broadcastOrderStatusUpdate = (userId, order) => {
  const sockets = clientsByUser.get(userId);
  if (!sockets || !sockets.size) return;
  const payload = JSON.stringify({
    type: "order:status",
    order: {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      trackingNumber: order.tracking_number,
      updatedAt: order.updated_at,
    },
  });
  for (const ws of sockets) {
    if (ws.readyState === ws.OPEN) ws.send(payload);
  }
};

const connectedUserCount = () => clientsByUser.size;

module.exports = { attach, broadcastOrderStatusUpdate, connectedUserCount };
