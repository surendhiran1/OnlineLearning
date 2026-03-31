import { useState, useEffect, useRef } from 'react';
import { 
  Paper, Typography, TextField, IconButton, Button, 
  List, ListItem, ListItemText, ListItemAvatar, Avatar,
  Dialog, DialogTitle, DialogContent,
  DialogActions, Checkbox, FormControlLabel, CircularProgress
} from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';
import { 
  Send as SendIcon, 
  Add as AddIcon, 
  AttachFile as AttachFileIcon,
  PictureAsPdf as PdfIcon,
  Close as CloseIcon,
  Group as GroupIcon,
  VideoCall as VideoCallIcon,
  Link as LinkIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { Client } from '@stomp/stompjs';
import { useSelector } from 'react-redux';
import { api } from '../../utils/axiosConfig';
import type { RootState } from '../../store/store';

interface Group {
    id: number;
    name: string;
    members: string[];     // display names
    memberIds: number[];   // IDs — used for reliable filtering
    lastMessage?: string;
    unreadCount?: number;
}

interface Message {
    id: string;
    userId: number;
    userName: string;
    message: string;
    type: string;
    attachments?: string[];
    createdAt: string;
}

export default function GroupChat() {
    const { accessToken, userId } = useSelector((state: RootState) => state.auth);
    const { darkMode } = useSelector((state: RootState) => state.theme);
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loadingGroups, setLoadingGroups] = useState(true);
    
    const [openCreate, setOpenCreate] = useState(false);
    const [openManageMembers, setOpenManageMembers] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [addingMemberId, setAddingMemberId] = useState<number | null>(null);
    
    const stompClient = useRef<Client | null>(null);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchGroups();
        fetchUsers();
        
        const client = new Client({
            brokerURL: 'ws://localhost:8080/ws/websocket', // Standard path for STOMP over pure WS with Spring
            connectHeaders: { Authorization: `Bearer ${accessToken}` },
            onConnect: () => {
                console.log('Connected to WebSocket');
            }
        });
        client.activate();
        stompClient.current = client;

        return () => {
            client.deactivate();
        };
    }, []);

    useEffect(() => {
        if (selectedGroup && stompClient.current) {
            const streamId = `group-${selectedGroup.id}`;
            const subscription = stompClient.current.subscribe(`/topic/stream/${streamId}`, (msg) => {
                try {
                    const newMsg = JSON.parse(msg.body);
                    if (newMsg && typeof newMsg === 'object') {
                        setMessages(prev => [...(prev || []), newMsg]);
                        scrollToBottom();
                    }
                } catch (e) {
                    console.error("Failed to parse incoming message", e);
                }
            });
            fetchMessages(selectedGroup.id);
            return () => {
                subscription.unsubscribe();
            };
        }
    }, [selectedGroup]);

    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerUrl, setViewerUrl] = useState('');
    const [viewerTitle, setViewerTitle] = useState('');

    const handleOpenViewer = (url: string, title: string) => {
        setViewerUrl(url);
        setViewerTitle(title);
        setViewerOpen(true);
    };

    const fetchGroups = async () => {
        try {
            const res = await api.get('/chat/groups');
            setGroups(res.data);
        } catch (err) { console.error(err); }
        setLoadingGroups(false);
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/chat/groups/users');
            const users = res.data || [];
            console.log(`[GroupChat] fetchUsers: got ${users.length} users`, users);
            setAllUsers(users);
        } catch (err: any) {
            const status = err?.response?.status;
            const msg = err?.response?.data || err?.message;
            console.error(`[GroupChat] fetchUsers failed — HTTP ${status}:`, msg);
        }
    };

    const fetchMessages = async (groupId: number) => {
        try {
            // Reusing existing ChatMessage logic via streamId
            const res = await api.get(`/messages/stream/group-${groupId}`);
            setMessages(res.data || []);
            scrollToBottom();
        } catch (err) { console.error(err); }
    };

    const handleSendMessage = () => {
        if (!input.trim() || !selectedGroup || !stompClient.current) return;
        
        const msgRequest = {
            courseId: 0, // Not tied to a specific course
            message: input,
            type: 'TEXT',
            attachments: []
        };

        stompClient.current.publish({
            destination: `/app/chat/group-${selectedGroup.id}`,
            body: JSON.stringify(msgRequest)
        });
        setInput('');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedGroup || !stompClient.current) return;

        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const res = await api.post('/chat/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const type = file.type.startsWith('image') ? 'IMAGE' : 
                         file.type.startsWith('video') ? 'VIDEO' : 'FILE';

            const msgRequest = {
                courseId: 0,
                message: `Uploaded a ${type.toLowerCase()}: ${file.name}`,
                type: type,
                attachments: [res.data.url]
            };

            stompClient.current.publish({
                destination: `/app/chat/group-${selectedGroup.id}`,
                body: JSON.stringify(msgRequest)
            });
        } catch (err) { alert("File upload failed"); }
    };

    const handleDeleteGroup = async () => {
        if (!selectedGroup || !window.confirm("Delete this group permanently?")) return;
        try {
            await api.delete(`/chat/groups/${selectedGroup.id}`);
            setSelectedGroup(null);
            fetchGroups();
        } catch (err) { alert("Failed to delete group"); }
    };

    const handleAddMember = async (userId: number) => {
        if (!selectedGroup || addingMemberId === userId) return;
        setAddingMemberId(userId);
        try {
            await api.post(`/chat/groups/${selectedGroup.id}/members/${userId}`);
            // Refetch groups to get updated memberIds
            const res = await api.get('/chat/groups');
            const updatedGroups = res.data || [];
            setGroups(updatedGroups);
            // eslint-disable-next-line eqeqeq
            const updated = updatedGroups.find((g: any) => g.id == selectedGroup.id);
            if (updated) setSelectedGroup(updated);
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.response?.statusText || err?.message || 'Failed to add member';
            alert(`Add failed: ${msg}`);
        }
        finally { setAddingMemberId(null); }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedUsers.length === 0) return;
        try {
            await api.post('/chat/groups', {
                name: groupName,
                userIds: selectedUsers
            });
            setOpenCreate(false);
            setGroupName('');
            setSelectedUsers([]);
            fetchGroups();
        } catch (err) { alert("Failed to create group"); }
    };

    const scrollToBottom = () => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };

    const renderAttachment = (type: string, url: string) => {
        const fullUrl = `http://localhost:8080/api/v1/modules/0/materials/download/${url}`;
        return (
            <div className="mt-3 p-2 bg-gray-50/50 rounded-lg border border-gray-100 group relative">
                {type === 'IMAGE' && (
                    <img 
                        src={fullUrl} 
                        alt="attachment" 
                        className="max-w-xs rounded-lg mb-2 cursor-pointer shadow-sm hover:opacity-90 transition"
                        onClick={() => window.open(fullUrl)}
                    />
                )}
                {type === 'VIDEO' && (
                    <video src={fullUrl} controls className="max-w-xs mb-2 rounded-lg" />
                )}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                        {type === 'IMAGE' ? <AttachFileIcon fontSize="small"/> : 
                         type === 'VIDEO' ? <AttachFileIcon fontSize="small"/> : <PdfIcon fontSize="small"/>}
                        <span className="truncate max-w-[150px] font-medium">{url}</span>
                    </div>
                    <Button 
                        variant="contained" 
                        size="small" 
                        color="secondary"
                        startIcon={<AttachFileIcon className="rotate-45" />} 
                        className="text-[10px] py-0.5 px-2 bg-gray-800 hover:bg-black normal-case rounded-md shadow-none"
                        onClick={() => handleOpenViewer(fullUrl, url)}
                    >
                        View File
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div className="h-[calc(100vh-100px)] flex space-x-4">
            {/* GROUPS SIDEBAR */}
            <Paper className="w-80 flex flex-col border border-gray-100 dark:border-slate-700 shadow-sm rounded-xl overflow-hidden dark:bg-slate-800">
                <div className="p-4 bg-gray-50/50 dark:bg-slate-700 p-6 flex justify-between items-center border-b dark:border-slate-600">
                    <Typography variant="h6" className="font-bold dark:text-white">Discussions</Typography>
                    <IconButton size="small" color="primary" onClick={() => setOpenCreate(true)}>
                        <AddIcon />
                    </IconButton>
                </div>
                {loadingGroups ? (
                    <div className="flex justify-center p-8"><CircularProgress size={24}/></div>
                ) : (
                    <List className="flex-1 overflow-y-auto p-0">
                        {(groups || []).map(group => (
                            <ListItemButton 
                                key={group.id} 
                                selected={selectedGroup?.id === group.id}
                                onClick={() => setSelectedGroup(group)}
                                className={`border-b border-gray-50 dark:border-slate-700 ${selectedGroup?.id === group.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                            >
                                <ListItemAvatar>
                                    <Avatar className={selectedGroup?.id === group.id ? 'bg-primary-600' : 'bg-gray-400 dark:bg-slate-600'}>
                                        <GroupIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText 
                                    primary={<Typography className="font-bold text-sm dark:text-white">{group.name}</Typography>}
                                    secondary={<Typography variant="caption" className="truncate block text-gray-500 dark:text-slate-400">{group.members.length} members</Typography>}
                                />
                            </ListItemButton>
                        ))}
                    </List>
                )}
            </Paper>

            {/* CHAT AREA */}
            <Paper className="flex-1 flex flex-col border border-gray-100 dark:border-slate-700 shadow-sm rounded-xl overflow-hidden dark:bg-slate-800">
                {selectedGroup ? (
                    <>
                        <div className="p-4 border-b dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center shadow-sm">
                            <div className="flex items-center space-x-3">
                                <Avatar className={darkMode ? 'bg-primary-900 text-primary-200' : 'bg-primary-100 text-primary-700'}>
                                    <GroupIcon />
                                </Avatar>
                                <div>
                                    <Typography variant="subtitle1" className="font-extrabold text-gray-900 dark:text-white">{selectedGroup?.name || 'Discussion'}</Typography>
                                    <Typography variant="caption" className="text-gray-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                        {selectedGroup?.members?.length} members active
                                    </Typography>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    variant="outlined" 
                                    size="small" 
                                    startIcon={<LinkIcon className="scale-75" />}
                                    className="rounded-full border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-bold capitalize hover:bg-gray-50 dark:hover:bg-slate-700 px-4"
                                    onClick={() => handleOpenViewer(`https://meet.jit.si/edunova-group-${selectedGroup.id}`, `Video Meeting Link`)}
                                >
                                    Join Link
                                </Button>
                                <Button 
                                    variant="contained" 
                                    size="small" 
                                    startIcon={<VideoCallIcon className="scale-75" />}
                                    className="bg-primary-600 hover:bg-primary-700 rounded-full px-5 py-2 font-bold shadow-lg shadow-primary-200 dark:shadow-none capitalize"
                                    onClick={() => handleOpenViewer(`https://meet.jit.si/edunova-group-${selectedGroup.id}`, `Video Meeting: ${selectedGroup.name}`)}
                                >
                                    Meet Now
                                </Button>

                                <IconButton 
                                    size="small" 
                                    onClick={() => {
                                        // Always refresh users AND groups when opening manage dialog
                                        Promise.all([fetchUsers(), fetchGroups()]).then(() => {
                                            setOpenManageMembers(true);
                                        });
                                    }} 
                                    title="Manage Members" 
                                    className="dark:text-slate-300"
                                >
                                    <PersonAddIcon />
                                </IconButton>

                                <IconButton size="small" color="error" onClick={handleDeleteGroup} title="Delete Group">
                                    <DeleteIcon />
                                </IconButton>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/20 dark:bg-slate-900/50">
                            {messages.map((msg, i) => {
                                const isMe = msg.userId === userId; 
                                return (
                                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm ${isMe ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600 border rounded-tl-none'}`}>
                                            {!isMe && <Typography variant="caption" className="font-bold block mb-1 text-primary-600 dark:text-primary-400">{msg.userName || 'Participant'}</Typography>}
                                            <Typography variant="body2">{msg.message}</Typography>
                                            {msg.attachments?.map(att => renderAttachment(msg.type, att))}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 border-t dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center space-x-3">
                            <input 
                                type="file" 
                                hidden 
                                ref={fileInputRef} 
                                onChange={handleFileUpload}
                                accept="image/*,video/*,application/pdf"
                            />
                            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-700 rounded-full">
                                <IconButton 
                                    size="small" 
                                    onClick={() => fileInputRef.current?.click()} 
                                    className="bg-white dark:bg-slate-600 hover:bg-gray-50 dark:hover:bg-slate-500 shadow-sm border border-gray-200 dark:border-slate-500 transition-all duration-300"
                                    title="Attach PDF or Image"
                                >
                                    <AttachFileIcon className="text-primary-600 dark:text-primary-400" />
                                </IconButton>
                            </div>
                            <TextField 
                                fullWidth 
                                size="small" 
                                placeholder="Send a message or share a file..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                autoComplete="off"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '24px',
                                        backgroundColor: darkMode ? '#1e293b' : '#f9fafb',
                                        color: darkMode ? 'white' : 'inherit',
                                        '& fieldset': { border: 'none' },
                                    }
                                }}
                            />
                            <IconButton 
                                color="primary" 
                                onClick={handleSendMessage} 
                                disabled={!input.trim()}
                                className={`${input.trim() ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500' } shadow-md p-2 transition-all duration-300`}
                            >
                                <SendIcon fontSize="small" />
                            </IconButton>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 bg-gray-50/30 dark:bg-slate-900/30">
                        <GroupIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                        <Typography variant="h6">Select a discussion group to start chatting</Typography>
                        <Button variant="outlined" className="mt-4" onClick={() => setOpenCreate(true)}>Create New Group</Button>
                    </div>
                )}
            </Paper>

            {/* CREATE GROUP DIALOG */}
            <Dialog 
                open={openCreate} 
                onClose={() => { setOpenCreate(false); setGroupName(''); setSelectedUsers([]); }} 
                maxWidth="sm" 
                fullWidth
                PaperProps={{ sx: { bgcolor: darkMode ? '#1e293b' : '#fff', borderRadius: '16px' } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: darkMode ? '#f1f5f9' : '#111827', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f3f4f6', pb: 2 }}>
                    <span className="font-extrabold text-lg">Create New Discussion Group</span>
                    <IconButton size="small" onClick={() => { setOpenCreate(false); setGroupName(''); setSelectedUsers([]); }} sx={{ color: darkMode ? '#94a3b8' : '#6b7280' }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <TextField 
                        fullWidth 
                        label="Group Name" 
                        margin="normal"
                        variant="outlined"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="e.g. Project Alpha Team"
                        autoFocus
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '10px',
                                bgcolor: darkMode ? '#0f172a' : '#f9fafb',
                                color: darkMode ? '#f1f5f9' : 'inherit',
                                '& fieldset': { borderColor: darkMode ? '#334155' : '#e5e7eb' },
                                '&:hover fieldset': { borderColor: darkMode ? '#60a5fa' : '#6366f1' },
                            },
                            '& .MuiInputLabel-root': { color: darkMode ? '#94a3b8' : '#6b7280' },
                        }}
                    />
                    <Typography variant="subtitle2" sx={{ mt: 2.5, mb: 1, fontWeight: 700, color: darkMode ? '#94a3b8' : '#4b5563' }}>Select Members:</Typography>
                    <List sx={{ maxHeight: 240, overflowY: 'auto', border: darkMode ? '1px solid #334155' : '1px solid #e5e7eb', borderRadius: '10px', bgcolor: darkMode ? '#0f172a' : '#f9fafb', p: 0 }}>
                        {(allUsers || []).length === 0 && (
                            <ListItem dense><ListItemText primary={<Typography variant="body2" sx={{ color: darkMode ? '#64748b' : '#9ca3af', textAlign: 'center' }}>No other users found</Typography>} /></ListItem>
                        )}
                        {(allUsers || []).map((user: any) => (
                            <ListItem key={user.id} dense divider sx={{ '&:last-child': { borderBottom: 'none' } }}>
                                <FormControlLabel
                                    sx={{ width: '100%', m: 0 }}
                                    control={
                                        <Checkbox 
                                            checked={selectedUsers.includes(user.id)}
                                            size="small"
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedUsers(prev => [...prev, user.id]);
                                                else setSelectedUsers(prev => prev.filter(id => id !== user.id));
                                            }}
                                        />
                                    }
                                    label={
                                        <span>
                                            <span style={{ fontWeight: 600, color: darkMode ? '#e2e8f0' : '#111827' }}>{user.fullName || user.email || 'Unknown'}</span>
                                            <span style={{ marginLeft: 6, fontSize: 11, color: darkMode ? '#64748b' : '#9ca3af', textTransform: 'capitalize' }}>({user.role?.toLowerCase() || 'user'})</span>
                                        </span>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                    {selectedUsers.length > 0 && (
                        <Typography variant="caption" sx={{ mt: 1, display: 'block', color: darkMode ? '#60a5fa' : '#6366f1', fontWeight: 600 }}>
                            {selectedUsers.length} member{selectedUsers.length > 1 ? 's' : ''} selected
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5, bgcolor: darkMode ? '#0f172a' : '#f9fafb', borderTop: darkMode ? '1px solid #334155' : '1px solid #f3f4f6', gap: 1 }}>
                    <Button onClick={() => { setOpenCreate(false); setGroupName(''); setSelectedUsers([]); }} sx={{ color: darkMode ? '#94a3b8' : '#6b7280', borderRadius: '8px' }}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleCreateGroup} 
                        disabled={!groupName.trim() || selectedUsers.length === 0}
                        sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, borderRadius: '8px', fontWeight: 700, px: 3 }}
                    >
                        Create Group
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MANAGE MEMBERS DIALOG */}
            <Dialog 
                open={openManageMembers} 
                onClose={() => setOpenManageMembers(false)} 
                maxWidth="sm" 
                fullWidth
                PaperProps={{ sx: { bgcolor: darkMode ? '#1e293b' : '#fff', borderRadius: '16px' } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: darkMode ? '#f1f5f9' : '#111827', borderBottom: darkMode ? '1px solid #334155' : '1px solid #f3f4f6', pb: 2 }}>
                    <span>
                        <span className="font-extrabold text-lg">Manage Group Members</span>
                        {selectedGroup?.name && <span style={{ color: darkMode ? '#60a5fa' : '#6366f1', marginLeft: 8 }}>— {selectedGroup.name}</span>}
                    </span>
                    <IconButton size="small" onClick={() => setOpenManageMembers(false)} sx={{ color: darkMode ? '#94a3b8' : '#6b7280' }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: darkMode ? '#94a3b8' : '#4b5563' }}>Current Members:</Typography>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                        {(selectedGroup?.members || []).length === 0 && (
                            <Typography variant="body2" sx={{ color: darkMode ? '#64748b' : '#9ca3af' }}>No members yet</Typography>
                        )}
                        {(selectedGroup?.members || []).map((m: string) => (
                            <div key={m} style={{
                                padding: '4px 14px',
                                background: darkMode ? 'rgba(99,102,241,0.15)' : '#eef2ff',
                                color: darkMode ? '#a5b4fc' : '#4f46e5',
                                borderRadius: 999,
                                fontSize: 13,
                                fontWeight: 600,
                                border: darkMode ? '1px solid #4338ca40' : '1px solid #c7d2fe',
                            }}>
                                {m}
                            </div>
                        ))}
                    </div>

                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: darkMode ? '#94a3b8' : '#4b5563' }}>Add More Members:</Typography>
                    <List sx={{ maxHeight: 240, overflowY: 'auto', border: darkMode ? '1px solid #334155' : '1px solid #e5e7eb', borderRadius: '10px', bgcolor: darkMode ? '#0f172a' : '#f9fafb', p: 0 }}>
                        {(() => {
                            // Triple-safety filter:
                            // 1. Exclude by memberIds (most reliable, from backend)
                            // 2. Fallback: exclude by matching name (in case memberIds is stale)
                            // 3. Always exclude the currently logged-in user
                            const memberIdSet = new Set<number>(
                                (selectedGroup?.memberIds || []).map((id: any) => Number(id))
                            );
                            const memberNameSet = new Set<string>(
                                (selectedGroup?.members || []).map((m: string) => m.trim().toLowerCase())
                            );
                            const availableUsers = (allUsers || []).filter((u: any) => {
                                // Exclude current logged-in user
                                if (Number(u.id) === Number(userId)) return false;
                                // If memberIds is populated, use it (reliable)
                                if (memberIdSet.size > 0) return !memberIdSet.has(Number(u.id));
                                // Fallback: use name matching
                                const name = (u.fullName || u.email || '').trim().toLowerCase();
                                return !memberNameSet.has(name);
                            });
                            if (availableUsers.length === 0) return (
                                <ListItem dense><ListItemText primary={<Typography variant="body2" sx={{ color: darkMode ? '#64748b' : '#9ca3af', textAlign: 'center' }}>All users are already members</Typography>} /></ListItem>
                            );
                            return availableUsers.map((user: any) => (
                                <ListItem 
                                    key={user.id} 
                                    dense 
                                    divider
                                    sx={{
                                        '&:last-child': { borderBottom: 'none' },
                                        '&:hover': { bgcolor: darkMode ? '#1e293b' : '#fff' },
                                        transition: 'background 0.15s',
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ width: 32, height: 32, bgcolor: darkMode ? '#4338ca' : '#6366f1', fontSize: 14, fontWeight: 700 }}>
                                            {(user.fullName || user.email || '?')[0].toUpperCase()}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText 
                                        primary={<Typography variant="body2" sx={{ fontWeight: 600, color: darkMode ? '#e2e8f0' : '#111827' }}>{user.fullName || user.email || 'Unknown'}</Typography>}
                                        secondary={<Typography variant="caption" sx={{ color: darkMode ? '#64748b' : '#9ca3af', textTransform: 'capitalize' }}>{user.role?.toLowerCase() || 'user'}</Typography>}
                                    />
                                    <Button 
                                        size="small" 
                                        variant="contained"
                                        disabled={addingMemberId === user.id}
                                        onClick={() => handleAddMember(user.id)}
                                        sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, borderRadius: '6px', fontWeight: 700, fontSize: 12, px: 2, minWidth: 60 }}
                                    >
                                        {addingMemberId === user.id ? '...' : 'Add'}
                                    </Button>
                                </ListItem>
                            ));
                        })()}
                    </List>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, bgcolor: darkMode ? '#0f172a' : '#f9fafb', borderTop: darkMode ? '1px solid #334155' : '1px solid #f3f4f6' }}>
                    <Button onClick={() => setOpenManageMembers(false)} sx={{ color: darkMode ? '#94a3b8' : '#6b7280', borderRadius: '8px', fontWeight: 700 }}>Done</Button>
                </DialogActions>
            </Dialog>

            {/* INTEGRATED CONTENT VIEWER */}
            <Dialog 
                open={viewerOpen} 
                onClose={() => setViewerOpen(false)} 
                maxWidth="lg" 
                fullWidth
                PaperProps={{
                    sx: {
                        height: '90vh',
                        borderRadius: '16px',
                        overflow: 'hidden'
                    }
                }}
            >
                <DialogTitle sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc' }}>
                    <Typography className="font-extrabold text-gray-900">Content Viewer: {viewerTitle}</Typography>
                    <IconButton size="small" onClick={() => setViewerOpen(false)}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0, height: '100%', bgcolor: '#1e293b' }}>
                    {viewerUrl.toLowerCase().endsWith('.png') || viewerUrl.toLowerCase().endsWith('.jpg') || viewerUrl.toLowerCase().endsWith('.jpeg') || viewerUrl.toLowerCase().endsWith('.gif') ? (
                        <div className="flex h-full items-center justify-center p-4">
                            <img src={viewerUrl} alt="ViewerContent" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                    ) : (
                        <iframe 
                            src={viewerUrl} 
                            title="ViewerContent" 
                            width="100%" 
                            height="100%" 
                            style={{ border: 'none' }}
                            allow="camera; microphone; display-capture; fullscreen; clipboard-read; clipboard-write"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
