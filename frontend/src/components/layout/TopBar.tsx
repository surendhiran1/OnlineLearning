import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import { logout } from '../../store/slices/authSlice';
import { IconButton, Avatar, Menu, MenuItem, Badge, Box, Typography, Divider, CircularProgress } from '@mui/material';
import { Notifications as NotificationsIcon, Menu as MenuIcon, Chat as ChatIcon, Announcement as AlertIcon, LightMode as LightModeIcon, DarkMode as DarkModeIcon } from '@mui/icons-material';
import { toggleDarkMode } from '../../store/slices/themeSlice';
import { Client } from '@stomp/stompjs';
import { api } from '../../utils/axiosConfig';

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { fullName, role, accessToken, email } = useSelector((state: RootState) => state.auth);
  const { darkMode } = useSelector((state: RootState) => state.theme);
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const stompClient = useRef<Client | null>(null);

  useEffect(() => {
    fetchNotifications();
    setupWebSocket();
    return () => {
      if (stompClient.current) {
        stompClient.current.deactivate();
      }
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const res = await api.get('/notifications?size=5');
      setNotifications(res.data.content || []);
      setUnreadCount(res.data.content.filter((n: any) => !n.isRead).length);
    } catch (err) { console.error(err); }
    setLoadingNotifs(false);
  };

  const setupWebSocket = () => {
    const client = new Client({
      brokerURL: 'ws://localhost:8080/ws/websocket',
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      onConnect: () => {
        client.subscribe(`/user/${email}/queue/notifications`, (msg) => {
          const newNotif = JSON.parse(msg.body);
          setNotifications(prev => [newNotif, ...prev.slice(0, 4)]);
          setUnreadCount(prev => prev + 1);
        });
      }
    });
    client.activate();
    stompClient.current = client;
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotifMenu = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setNotifAnchorEl(null);
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => {
    handleClose();
    dispatch(logout());
  };

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 h-16 flex items-center justify-between px-4 sticky top-0 z-20 transition-colors duration-300">
      <div className="flex items-center md:hidden">
        <IconButton onClick={onMenuClick} edge="start" color="inherit" aria-label="menu" className="dark:text-slate-100">
          <MenuIcon />
        </IconButton>
        <span className="ml-2 text-xl font-bold text-primary-600">EduNova</span>
      </div>
      <div className="hidden md:block">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-slate-100 italic font-bold">EduNova Dashboard</h2>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        <IconButton color="inherit" onClick={() => dispatch(toggleDarkMode())} className="text-gray-600 dark:text-slate-300 transition-all hover:scale-110">
          {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>

        <IconButton color="inherit" className="text-gray-600 dark:text-slate-300" onClick={handleNotifMenu}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        <Menu
          anchorEl={notifAnchorEl}
          open={Boolean(notifAnchorEl)}
          onClose={handleClose}
          PaperProps={{ className: "w-80 max-h-96 rounded-xl shadow-lg mt-2 border border-gray-100" }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box className="px-4 py-2 bg-gray-50 dark:bg-slate-700/50 flex justify-between items-center">
            <Typography variant="subtitle2" className="font-bold dark:text-white">Notifications</Typography>
            <Typography variant="caption" className="cursor-pointer text-primary-600 hover:text-primary-700 dark:text-primary-400" onClick={fetchNotifications}>Refresh</Typography>
          </Box>
          <Divider />
          {loadingNotifs ? (
            <div className="flex justify-center p-4"><CircularProgress size={20}/></div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No notifications yet</div>
          ) : (
            notifications.map((notif) => (
              <MenuItem 
                key={notif.id} 
                onClick={() => { markAsRead(notif.id); handleClose(); }} 
                className={`py-3 px-4 border-b dark:border-slate-700 flex flex-col items-start hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${!notif.isRead ? 'bg-blue-50/30 dark:bg-blue-900/20 font-medium' : ''}`}
              >
                <div className="flex items-center w-full mb-1">
                  {notif.type === 'CHAT' ? <ChatIcon fontSize="small" className="text-primary-600 mr-2" /> : <AlertIcon fontSize="small" className="text-orange-500 mr-2" />}
                  <Typography variant="body2" className="flex-1 font-bold text-gray-800 dark:text-slate-100">{notif.title}</Typography>
                  <Typography variant="caption" className="text-gray-400 dark:text-gray-500">{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                </div>
                <Typography variant="caption" className="text-gray-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{notif.content}</Typography>
              </MenuItem>
            ))
          )}
        </Menu>
        
        <div className="flex items-center cursor-pointer" onClick={handleMenu}>
          <div className="hidden md:block text-right mr-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white leading-none">{fullName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{role === 'STAFF' ? 'Instructor' : 'Student'}</p>
          </div>
          <Avatar sx={{ bgcolor: '#0ea5e9' }}>{fullName?.charAt(0)}</Avatar>
        </div>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleClose}>Profile</MenuItem>
          <MenuItem onClick={handleClose}>Settings</MenuItem>
          <MenuItem onClick={handleLogout} className="text-red-600">Logout</MenuItem>
        </Menu>
      </div>
    </header>
  );
}
