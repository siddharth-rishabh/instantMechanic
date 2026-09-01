import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useToast } from '../components/ui';

export function useSocket() {
  const toast = useToast();
  useEffect(() => {
    const token = localStorage.getItem('instant-mechanic-token');
    if (!token) return undefined;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
    const socket = io(baseUrl, { auth: { token } });
    const refresh = () => window.dispatchEvent(new Event('operations:refresh'));
    socket.on('booking:created', () => { refresh(); toast('New booking received.'); });
    socket.on('booking:updated', refresh);
    socket.on('booking:statusChanged', () => { refresh(); toast('A booking status was updated.'); });
    socket.on('notification:new', () => { refresh(); toast('New operations notification.'); });
    return () => socket.disconnect();
  }, [toast]);
}
