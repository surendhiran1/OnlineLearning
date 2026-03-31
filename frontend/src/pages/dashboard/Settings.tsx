import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Typography, Paper, TextField, Button, Avatar, Switch, FormControlLabel, Box, IconButton } from '@mui/material';
import type { RootState } from '../../store/store';
import { toggleDarkMode, setPrimaryColor } from '../../store/slices/themeSlice';

export default function Settings() {
  const dispatch = useDispatch();
  const { email, role, fullName } = useSelector((state: RootState) => state.auth);
  const { darkMode, primaryColor } = useSelector((state: RootState) => state.theme);

  const colors = [
    { name: 'Indigo', hex: '#6366f1' },
    { name: 'Rose', hex: '#f43f5e' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Sky', hex: '#0ea5e9' },
    { name: 'Violet', hex: '#8b5cf6' },
  ];

  const [formData, setFormData] = useState({
    fullName: fullName || '',
    email: email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushAlerts: true,
    courseUpdates: true
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleToggle = (name: string) => {
    setNotifications(prev => ({ ...prev, [name]: !prev[name as keyof typeof prev] }));
  };

  const handleSaveProfile = () => {
    alert('Profile preferences saved locally. Waiting on PUT /api/v1/users/profile deployment.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <Typography variant="h4" className="font-bold dark:text-white">Account Settings</Typography>
        <Typography color="textSecondary">Manage your profile, security, and notification preferences.</Typography>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Paper className="p-6 text-center border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col items-center">
             <Avatar className="w-24 h-24 mb-4" sx={{ bgcolor: 'var(--primary-600)', fontSize: '2.5rem' }}>
                {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
             </Avatar>
             <Typography variant="h6" className="font-bold dark:text-white">{fullName}</Typography>
             <Typography variant="body2" color="textSecondary" className="mb-4">{email}</Typography>
             <span className="bg-primary-50 text-primary-700 uppercase tracking-widest text-xs font-bold px-3 py-1 rounded-full">{role}</span>
          </Paper>
          
          <Paper className="p-6 border border-gray-100 dark:border-slate-700 shadow-sm">
             <Typography variant="h6" className="font-bold mb-4 dark:text-slate-100">Appearance & Branding</Typography>
             <div className="flex flex-col space-y-4">
                <FormControlLabel 
                  control={<Switch checked={darkMode} onChange={() => dispatch(toggleDarkMode())} color="primary" />} 
                  label={darkMode ? 'Dark Mode Active' : 'Light Mode Active'} 
                />
                
                <div>
                  <Typography variant="caption" color="textSecondary" className="uppercase font-bold tracking-widest block mb-3">Theme Color</Typography>
                  <Box className="flex flex-wrap gap-3">
                    {colors.map(color => (
                       <IconButton 
                        key={color.hex} 
                        size="small" 
                        onClick={() => dispatch(setPrimaryColor(color.hex))}
                        sx={{ 
                          bgcolor: color.hex, 
                          width: 28, 
                          height: 28, 
                          border: primaryColor === color.hex ? '3px solid white' : 'none',
                          boxShadow: primaryColor === color.hex ? '0 0 0 2px ' + color.hex : 'none',
                          '&:hover': { bgcolor: color.hex, opacity: 0.8 }
                        }}
                       />
                    ))}
                  </Box>
                </div>
             </div>
          </Paper>

          <Paper className="p-6 border border-gray-100 dark:border-slate-700 shadow-sm">
             <Typography variant="h6" className="font-bold mb-4">Notifications</Typography>
             <div className="flex flex-col space-y-2">
                <FormControlLabel control={<Switch checked={notifications.emailAlerts} onChange={() => handleToggle('emailAlerts')} color="primary" />} label="Email Alerts" />
                <FormControlLabel control={<Switch checked={notifications.pushAlerts} onChange={() => handleToggle('pushAlerts')} color="primary" />} label="Push Notifications" />
                <FormControlLabel control={<Switch checked={notifications.courseUpdates} onChange={() => handleToggle('courseUpdates')} color="primary" />} label="Course Updates" />
             </div>
          </Paper>
        </div>

        <div className="md:col-span-2 space-y-6">
           <Paper className="p-8 border border-gray-100 dark:border-slate-700 shadow-sm">
             <Typography variant="h6" className="font-bold mb-6 dark:text-white">Profile Details</Typography>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <TextField fullWidth label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} />
               <TextField fullWidth label="Email Address" name="email" value={formData.email} onChange={handleChange} disabled />
             </div>
             <div className="flex justify-end mt-6">
               <Button variant="contained" className="bg-primary-600 hover:bg-primary-700" onClick={handleSaveProfile}>Save Profile</Button>
             </div>
           </Paper>

           <Paper className="p-8 border border-gray-100 shadow-sm">
             <Typography variant="h6" className="font-bold mb-2">Change Password</Typography>
             <Typography variant="body2" color="textSecondary" className="mb-6">Ensure your account uses a long, random password to stay secure.</Typography>
             
             <div className="space-y-4">
               <TextField fullWidth type="password" label="Current Password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <TextField fullWidth type="password" label="New Password" name="newPassword" value={formData.newPassword} onChange={handleChange} />
                 <TextField fullWidth type="password" label="Confirm Password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} />
               </div>
             </div>
             <div className="flex justify-end mt-6">
               <Button variant="outlined" color="primary" onClick={handleSaveProfile} disabled={!formData.newPassword}>Update Password</Button>
             </div>
           </Paper>
        </div>
      </div>
    </div>
  );
}
