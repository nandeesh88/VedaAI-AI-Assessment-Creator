'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useAssignmentStore } from '@/store/assignmentStore';

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  (process.env.NODE_ENV !== 'production' ? 'ws://localhost:4000' : '');

if (!WS_URL) {
  throw new Error('NEXT_PUBLIC_WS_URL is not defined in production');
}

export function useAssignmentWebSocket(assignmentId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const { setGenerationStatus, setGenerationResult, setGenerationError } = useAssignmentStore();

  const connect = useCallback(() => {
    if (!assignmentId) return;

    const url = `${WS_URL}/ws?assignmentId=${assignmentId}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected for assignment:', assignmentId);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log('[WS] Message:', msg);

        if (msg.type === 'job_status') {
          setGenerationStatus(msg.status, msg.progress || 0, msg.message || '');
        } else if (msg.type === 'job_completed') {
          setGenerationResult(msg.result);
        } else if (msg.type === 'job_failed') {
          setGenerationError(msg.error || 'Generation failed');
        }
      } catch (err) {
        console.error('[WS] Parse error:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected');
      wsRef.current = null;
    };
  }, [assignmentId, setGenerationStatus, setGenerationResult, setGenerationError]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  return { disconnect };
}
