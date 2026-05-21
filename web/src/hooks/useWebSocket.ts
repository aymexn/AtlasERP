import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../lib/api';

export function useWebSocket(companyId: string | undefined, onKpiUpdate: (data: any) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!companyId) return;

    // Connect to NestJS API Gateway under 'dashboard' namespace dynamically
    const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const serverUrl = `${base}/dashboard`;

    const socket = io(serverUrl, {
      query: { companyId },
      transports: ['websocket', 'polling'], // Fallback transport
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
    });

    socket.on('connect', () => {
      console.log(`Connected to Dashboard WebSocket Room: ${companyId}`);
    });

    socket.on('dashboard:refresh', (data) => {
      console.log('WebSocket KPI Update received:', data);
      onKpiUpdate(data);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [companyId, onKpiUpdate]);

  return socketRef.current;
}
