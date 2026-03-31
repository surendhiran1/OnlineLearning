import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Button, Paper, Box, Grid } from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import { 
  Add as AddIcon, 
  People as PeopleIcon, 
  LibraryBooks as CoursesIcon, 
  Timeline as GrowthIcon,
  TrendingUp,
  EventNote
} from '@mui/icons-material';
import { api } from '../../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { darkMode } = useSelector((state: RootState) => state.theme);
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          api.get('/courses'),
          api.get('/users/students')
        ]);
        setCourses(cRes.data.content || []);
        setStudents(sRes.data || []);
      } catch (err) {
        console.error("Error fetching staff metrics:", err);
      }
    };
    fetchData();
  }, []);

  const totalStudents = students.length;
  const activeCourses = courses.length;
  const totalHrs = courses.reduce((sum, c) => sum + (c.estimatedDuration || 0), 0);
  const totalXP = students.reduce((sum, s) => sum + (s.totalXp || 0), 0);

  // Growth Data Mock for Chart
  const growthData = [
    { name: 'Mon', students: 4 },
    { name: 'Tue', students: 7 },
    { name: 'Wed', students: 5 },
    { name: 'Thu', students: 12 },
    { name: 'Fri', students: 18 },
    { name: 'Sat', students: 14 },
    { name: 'Sun', students: 22 },
  ];

  // Category distribution for bar chart
  const categories: any[] = [];
  const catMap = courses.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {});
  Object.entries(catMap).forEach(([name, value]) => categories.push({ name, count: value }));

  return (
    <div className="space-y-6 pb-12">
      {/* Header Command Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div>
          <Typography variant="h5" className="font-extrabold text-gray-900 dark:text-white">Instructor Command Center</Typography>
          <Typography color="textSecondary" variant="body2">System operational. You have {activeCourses} managed courses and {totalStudents} active learners.</Typography>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            className="bg-primary-600 hover:bg-primary-700 rounded-xl px-6 py-2.5 shadow-lg shadow-primary-200 capitalize font-bold"
            onClick={() => navigate('/courses/manage')}
          >
            Create Course
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<PeopleIcon />} 
            className="rounded-xl px-6 py-2.5 capitalize font-bold border-gray-200 text-gray-700 hover:bg-gray-50"
            onClick={() => navigate('/students')}
          >
            Manage Students
          </Button>
        </div>
      </div>

      {/* KPI GRID */}
      <Grid container spacing={3}>
        {[
          { label: 'Total Students', value: totalStudents, icon: <PeopleIcon />, color: 'blue', trend: '+12%' },
          { label: 'Managed Courses', value: activeCourses, icon: <CoursesIcon />, color: 'purple', trend: 'Active' },
          { label: 'Learning Velocity', value: `${totalHrs}h`, icon: <GrowthIcon />, color: 'orange', trend: 'Total' },
          { label: 'XP Distributed', value: totalXP, icon: <TrendingUp />, color: 'green', trend: 'Real-time' }
        ].map((kpi, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
            <Card className="shadow-none border border-gray-100 dark:border-slate-700 dark:bg-slate-800 rounded-2xl overflow-hidden hover:border-primary-200 transition-all duration-300">
              <CardContent className="p-6">
                <Box className="flex justify-between items-start mb-4">
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${kpi.color}.50`, color: `${kpi.color}.600` }}>
                    {kpi.icon}
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', px: 1, py: 0.5, borderRadius: 1, bgcolor: kpi.color === 'green' ? 'success.50' : 'grey.50', color: kpi.color === 'green' ? 'success.600' : 'grey.600' }}>
                    {kpi.trend}
                  </Typography>
                </Box>
                <Typography variant="h4" className="font-black text-gray-900 dark:text-white mb-1">{kpi.value}</Typography>
                <Typography variant="body2" color="textSecondary" className="font-semibold uppercase tracking-wider text-xs">
                  {kpi.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* CHARTS ROW */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper className="p-6 rounded-2xl shadow-none border border-gray-100 dark:border-slate-700 dark:bg-slate-800 h-full">
            <Box className="flex justify-between items-center mb-6">
               <Typography variant="h6" className="font-bold flex items-center gap-2 dark:text-white">
                 <GrowthIcon color="primary" /> Student Enrollment Growth
               </Typography>
               <Button size="small" className="text-primary-600 font-bold">Week</Button>
            </Box>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#f0f0f0'} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="students" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorStudents)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper className="p-6 rounded-2xl shadow-none border border-gray-100 dark:border-slate-700 dark:bg-slate-800 h-full">
            <Typography variant="h6" className="font-bold mb-6 flex items-center gap-2 dark:text-white">
              <CoursesIcon className="text-orange-500" /> Category Split
            </Typography>
            <Box sx={{ width: '100%', minHeight: 300 }}>
              <ResponsiveContainer>
                <BarChart data={categories} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#334155' : '#f0f0f0'} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} tick={{fontSize: 10, fill: '#64748b'}} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* QUICK STATUS & ACTIVITY */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
           <Paper className="p-6 rounded-2xl shadow-none border border-gray-100 dark:border-slate-700 dark:bg-slate-800">
              <Typography variant="h6" className="font-bold mb-4 flex items-center gap-2 dark:text-white">
                <EventNote className="text-blue-500" /> Recent Student Signups
              </Typography>
              <div className="space-y-3">
                 {students.slice(0, 4).map((s, i) => (
                    <Box key={i} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600">
                       <Box className="flex items-center gap-3">
                          <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: darkMode ? 'primary.900' : 'primary.100', color: darkMode ? 'primary.100' : 'primary.700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                             {s.fullName?.charAt(0)}
                          </Box>
                          <Box>
                             <Typography variant="subtitle2" className="font-bold dark:text-white">{s.fullName}</Typography>
                             <Typography variant="caption" className="text-gray-500 dark:text-gray-400">{s.email}</Typography>
                          </Box>
                       </Box>
                       <Typography variant="caption" className="font-bold text-gray-500 dark:text-gray-400">Lv.{s.currentLevel}</Typography>
                    </Box>
                 ))}
                 {students.length === 0 && <Typography color="textSecondary" className="text-center py-4">No students enrolled yet.</Typography>}
              </div>
           </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
           <Paper className="p-6 rounded-2xl shadow-none border border-gray-100 bg-gray-900 text-white relative overflow-hidden">
              <Box sx={{ position: 'absolute', right: -40, bottom: -40, width: 192, height: 192, bgcolor: 'primary.500', borderRadius: '50%', opacity: 0.2, filter: 'blur(48px)' }}></Box>
              <Typography variant="h6" className="font-bold mb-2">Upgrade to EduNova Pro</Typography>
              <Typography variant="body2" className="text-gray-400 mb-6 max-w-xs">Get advanced AI grading features and unlimited hosting space for your course assets.</Typography>
              <Button variant="contained" sx={{ bgcolor: 'primary.600', '&:hover': { bgcolor: 'primary.700' }, borderRadius: 3, px: 3, py: 1, textTransform: 'none', fontWeight: 'bold' }}>
                 View Premium Perks
              </Button>
           </Paper>
        </Grid>
      </Grid>
    </div>
  );
}
