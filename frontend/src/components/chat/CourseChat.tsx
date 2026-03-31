import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { Typography, Paper, TextField, IconButton, Avatar, Collapse } from '@mui/material';
import { Send as SendIcon, KeyboardArrowDown as MinimizeIcon, KeyboardArrowUp as MaximizeIcon } from '@mui/icons-material';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface Message {
  id?: string;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: string;
}

interface CourseChatProps {
  courseId: number;
}

export default function CourseChat({ courseId }: CourseChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [minimized, setMinimized] = useState(false);
  const { accessToken, fullName } = useSelector((state: RootState) => state.auth);
  const { darkMode } = useSelector((state: RootState) => state.theme);
  const stompClientRef = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!accessToken) return;

    const socket = new SockJS('http://localhost:8080/ws');
    const stompClient = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`
      },
      onConnect: () => {
        stompClient.subscribe(`/topic/stream/${courseId}`, (message) => {
          if (message.body) {
            setMessages((prev) => [...prev, JSON.parse(message.body)]);
          }
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
      }
    });

    stompClient.activate();
    stompClientRef.current = stompClient;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [courseId, accessToken]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && stompClientRef.current && stompClientRef.current.connected) {
      const msg = {
        senderName: fullName,
        content: inputMessage,
        streamId: courseId.toString(),
      };
      
      stompClientRef.current.publish({
        destination: `/app/chat/${courseId}`,
        body: JSON.stringify(msg)
      });
      setInputMessage('');
    }
  };

  return (
    <Paper 
      className={`flex flex-col border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden dark:bg-slate-800 transition-all duration-300 ${minimized ? 'h-auto' : 'h-[450px]'}`}
    >
      <div 
        className="bg-primary-600 text-white px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-primary-700 transition-colors"
        onClick={() => setMinimized(!minimized)}
      >
        <div className="flex items-center gap-2">
          <Typography variant="subtitle2" className="font-bold">Course Discussion Form</Typography>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        </div>
        <IconButton size="small" className="text-white p-0">
          {minimized ? <MaximizeIcon /> : <MinimizeIcon />}
        </IconButton>
      </div>
      
      <Collapse in={!minimized} timeout="auto" className="flex flex-col flex-1 overflow-hidden">
        <div className="flex flex-col h-full flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-900/50">
            {messages.map((msg, idx) => {
              const isMe = msg.senderName === fullName;
              return (
                <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Avatar 
                      sx={{ width: 32, height: 32, bgcolor: isMe ? '#0ea5e9' : '#94a3b8' }}
                      className={`${isMe ? 'ml-2' : 'mr-2'} mt-1 text-sm`}
                    >
                      {msg.senderName?.charAt(0) || '?'}
                    </Avatar>
                    <div>
                      {!isMe && <Typography variant="caption" className="text-gray-500 dark:text-slate-400 ml-1 block">{msg.senderName}</Typography>}
                      <div className={`px-4 py-2 rounded-2xl ${isMe ? 'bg-primary-500 text-white rounded-tr-none' : 'bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-white rounded-tl-none'}`}>
                        <Typography variant="body2">{msg.content}</Typography>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Say hi to start the conversation!
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-3 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex items-center">
            <TextField
              fullWidth
              size="small"
              placeholder="Type a message..."
              variant="outlined"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="bg-gray-50 dark:bg-slate-700 bg-opacity-50"
              InputProps={{ sx: { borderRadius: 8, color: darkMode ? 'white' : 'inherit' } }}
            />
            <IconButton 
              type="submit" 
              color="primary" 
              disabled={!inputMessage.trim()}
              className="ml-2 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-800/50"
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </form>
        </div>
      </Collapse>
    </Paper>
  );
}
