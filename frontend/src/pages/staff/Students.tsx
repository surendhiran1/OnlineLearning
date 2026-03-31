import { useState, useEffect } from 'react';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Avatar, CircularProgress, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Select, MenuItem, Chip, Tabs, Tab } from '@mui/material';
import { PersonAdd as AddUserIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { api } from '../../utils/axiosConfig';

export default function Students() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'STUDENT' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users/all');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      await api.post('/users/admin', form);
      setOpenAdd(false);
      fetchUsers();
    } catch (err) { alert("Failed to add user"); }
  };

  const handleDelete = async (id: number) => {
    if(!window.confirm("Are you sure you want to remove this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch(e) { alert("Failed to delete user"); }
  };

  if (loading) return <div className="flex justify-center p-12"><CircularProgress /></div>;

  const filteredUsers = users.filter(u => tab === 0 ? u.role === 'STUDENT' : u.role === 'STAFF');

  return (
    <div className="space-y-6">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <Typography variant="h4" className="font-bold text-gray-900 dark:text-white">User Management</Typography>
          <Typography color="textSecondary">Manage all learners and instructors on the platform.</Typography>
        </div>
        <Button variant="contained" className="bg-primary-600" startIcon={<AddUserIcon />} onClick={() => setOpenAdd(true)}>
          Add User
        </Button>
      </div>

      <Paper elevation={0} className="border-b border-gray-200 mb-6 bg-transparent rounded-none">
        <Tabs value={tab} onChange={(_, nv) => setTab(nv)} indicatorColor="primary" textColor="primary">
          <Tab label="Students" />
          <Tab label="Instructors" />
        </Tabs>
      </Paper>

      <TableContainer component={Paper} className="shadow-sm border border-gray-100 dark:border-slate-700">
        <Table>
          <TableHead className="bg-gray-50 dark:bg-slate-800">
            <TableRow>
              <TableCell className="font-semibold text-gray-700 dark:text-slate-100">Account</TableCell>
              <TableCell className="font-semibold text-gray-700 dark:text-slate-100">Contact</TableCell>
              <TableCell className="font-semibold text-gray-700 dark:text-slate-100">Level / Role</TableCell>
              <TableCell className="font-semibold text-gray-700 dark:text-slate-100">XP</TableCell>
              <TableCell className="font-semibold text-gray-700 dark:text-slate-100 text-right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar sx={{ bgcolor: user.role === 'STAFF' ? 'var(--secondary-600)' : 'var(--primary-600)' }}>
                      {user.fullName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="subtitle2" className="font-medium">{user.fullName}</Typography>
                  </div>
                </TableCell>
                <TableCell><Typography variant="body2">{user.email}</Typography></TableCell>
                <TableCell>
                  <Chip size="small" label={user.role} color={user.role==='STAFF'?'secondary':'primary'} variant="outlined" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" className="font-mono text-gray-600 dark:text-slate-300">{user.totalXp} XP</Typography>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="small" color="error" onClick={() => handleDelete(user.id)} startIcon={<DeleteIcon />}>Remove</Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow><TableCell colSpan={5} align="center" className="py-8 text-gray-500">No users found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent dividers className="space-y-4">
          <TextField fullWidth label="Full Name" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} />
          <TextField fullWidth label="Email Address" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <TextField fullWidth label="Temporary Password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          <div className="mt-2">
            <Typography variant="caption" className="block mb-1 text-gray-600">Account Role</Typography>
            <Select fullWidth value={form.role} onChange={e => setForm({...form, role: e.target.value as string})}>
              <MenuItem value="STUDENT">Student (Learner)</MenuItem>
              <MenuItem value="STAFF">Instructor (Staff)</MenuItem>
            </Select>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddUser} variant="contained" className="bg-primary-600" disabled={!form.fullName || !form.email || !form.password}>Create Account</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
