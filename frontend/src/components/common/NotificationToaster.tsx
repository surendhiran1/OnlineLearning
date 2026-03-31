import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { Snackbar, Alert } from '@mui/material';
import type { SnackbarCloseReason } from '@mui/material';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function NotificationToaster() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'info' | 'success' | 'warning'>('info');
  
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const socket = new SockJS('http://localhost:8080/ws');
    const stompClient = new Client({
      webSocketFactory: () => socket,
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      onConnect: () => {
        stompClient.subscribe(`/user/queue/notifications`, (frame) => {
          if (frame.body) {
            try {
              const notification = JSON.parse(frame.body);
              setMessage(notification.message || 'You have a new notification');
              setSeverity(notification.type === 'ACHIEVEMENT' ? 'success' : 'info');
              setOpen(true);
            } catch (e) {
              setMessage(frame.body);
              setSeverity('info');
              setOpen(true);
            }
          }
        });
      }
    });

    stompClient.activate();
    stompClientRef.current = stompClient;

    return () => {
      if (stompClientRef.current) stompClientRef.current.deactivate();
    };
  }, [accessToken]);

  const handleClose = (
    _event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason
  ) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <Snackbar 
      open={open} 
      autoHideDuration={6000} 
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert onClose={handleClose} severity={severity} variant="filled" sx={{ width: '100%', boxShadow: 3 }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
