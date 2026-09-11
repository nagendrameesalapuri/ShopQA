import { useEffect, useRef, useState } from 'react';

// Live order-status updates over WebSocket. The backend pushes a message
// whenever an admin changes this order's status (see
// backend/src/config/websocket.js + PUT /api/orders/admin/:id/status).
// Good target for practicing page.waitForEvent('websocket') and multi-tab/
// multi-context tests (admin tab mutates, this hook's tab observes the push
// without a page reload).
export default function useLiveOrderStatus(orderId) {
  const [liveUpdate, setLiveUpdate] = useState(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!orderId) return undefined;
    const token = localStorage.getItem('accessToken');
    if (!token) return undefined;

    const apiUrl = process.env.REACT_APP_API_URL;
    let wsUrl;
    if (apiUrl) {
      wsUrl = apiUrl.replace(/^http/, 'ws').replace(/\/api\/?$/, '') + '/ws';
    } else {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${proto}//${window.location.host}/ws`;
    }

    const ws = new WebSocket(`${wsUrl}?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'order:status' && msg.order.id === orderId) {
          setLiveUpdate(msg.order);
        }
      } catch {}
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [orderId]);

  return { liveUpdate, connected };
}
