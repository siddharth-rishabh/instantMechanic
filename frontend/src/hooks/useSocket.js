import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useToast } from '../components/ui';
import { backendUrl } from '../services/api';

export function useSocket() {
  const toast = useToast();
  useEffect(() => {
    const token = localStorage.getItem('instant-mechanic-token');
    if (!token) return undefined;
    const socket = io(backendUrl, { auth: { token } });
    const refresh = () => window.dispatchEvent(new Event('operations:refresh'));
    socket.on('booking:created', () => { refresh(); toast('New booking received.'); });
    socket.on('booking:updated', refresh);
    socket.on('booking:statusChanged', () => { refresh(); toast('A booking status was updated.'); });
    socket.on('notification:new', () => { refresh(); toast('New operations notification.'); });
    return () => socket.disconnect();
  }, [toast]);
}
