'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface RealTimeContextType {
  getSocket: () => Socket | null;
}

const RealTimeContext = createContext<RealTimeContextType>({ getSocket: () => null });

export const useRealTime = () => useContext(RealTimeContext);

interface RealTimeProviderProps {
  supplierId: string;
  children: React.ReactNode;
}

export function RealTimeProvider({ supplierId, children }: RealTimeProviderProps) {
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Audio Ding (Base64)
    const playDing = () => {
      const audio = new Audio('data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAASAAADbWFqb3JfYnJhbmQAZGFzaABUWFhYAAAAEgAAA21pbm9yX3ZlcnNpb24AMABUWFhYAAAAHAAAA2NvbXBhdGlibGVfYnJhbmRzAGlzbzZtcDQxAFRTU0UAAAAPAAADTGF2ZjYwLjMuMTAwAAAAAAAAAAAAAAD/+000AAAAAAAAAAAAAAAAAAAAAAABYaW5nAAAADwAAABIAAAfJAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAAAAHAAAAbHBhbW0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/8000AAAAAAEAVAAAAAAAK4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8000AAAAAAEAVAAAAAAAK4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8000AAAAAAEAVAAAAAAAK4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8000AAAAAAEAVAAAAAAAK4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8000AAAAAAEAVAAAAAAAK/9N6AABGAB6CkAArD9X9/hAEEV/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf/TegAAUYAegpAACsP1f3+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf/TegAAVYAegpAACsP1f3+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf/TegAAWYAegpAACsP1f3+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf/TegAAaoAegpAACsP1f3+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf/TegAAbIAegpAACsP1f3+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf+EAQRX/4QBBFf/');
      audio.play().catch(e => console.log('Audio error:', e));
    };

    if (!supplierId) return;

    // Connect to backend
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8080', {
      withCredentials: true,
      transports: ['polling', 'websocket']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔗 Connected to realtime server');
      socket.emit('join_room', `supplier_${supplierId}`);
    });

    socket.on('SCHEDULE_UPDATED', (data) => {
      console.log('⚡ Schedule updated:', data);
      
      // Play sound
      playDing();

      // Show toast
      if (data.type === 'APPROVED') {
        toast.success(`Schedule Approved!`, {
          description: `"${data.title}" has been approved by admin.`,
          duration: 5000,
        });
      } else {
        toast.error(`Schedule Rejected!`, {
          description: `"${data.title}" was rejected: ${data.reason}`,
          duration: 10000,
        });
      }

      // Refresh data (Server Actions refresh)
      router.refresh();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [supplierId, router]);

  return (
    <RealTimeContext.Provider value={{ getSocket: () => socketRef.current }}>
      {children}
    </RealTimeContext.Provider>
  );
}
