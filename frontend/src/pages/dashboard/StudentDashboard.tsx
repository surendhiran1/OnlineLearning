import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, LinearProgress, Box, Button } from '@mui/material';
import { EmojiEvents, LocalLibrary, Code, Star, CheckCircle } from '@mui/icons-material';
import { api } from '../../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { fullName } = useSelector((state: RootState) => state.auth);
  const { darkMode } = useSelector((state: RootState) => state.theme);
  const [courses, setCourses] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>({ totalXp: 0, currentLevel: 1 });
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, bRes, profRes, qRes, aRes] = await Promise.all([
          api.get('/courses'),
          api.get('/gamification/badges'),
          api.get('/users/profile'),
          api.get('/quizzes/all'),
          api.get('/assignments/all')
        ]);
        setCourses(cRes.data.content || []);
        setBadges(bRes.data || []);
        setProfile(profRes.data);
        setQuizzes(qRes.data || []);
        setAssignments(aRes.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const inProgressCourses = courses.slice(0, 3);

  // Gamification Metrics Engine dynamic calculation
  const currentXP = profile.totalXp; 
  let nextLevelXP = 100;
  if (profile.currentLevel === 1) nextLevelXP = 100;
  else if (profile.currentLevel === 2) nextLevelXP = 300;
  else if (profile.currentLevel === 3) nextLevelXP = 600;
  else if (profile.currentLevel === 4) nextLevelXP = 1000;
  else if (profile.currentLevel === 5) nextLevelXP = 1500;
  const level = profile.currentLevel;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-gray-900 rounded-2xl p-8 mb-8 text-white shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/3"></div>
        <div className="z-10">
          <Typography variant="h4" className="font-extrabold mb-1">Welcome back, {fullName}!</Typography>
          <Typography variant="body1" className="text-gray-300">You're on a 5-day learning streak. Keep it up!</Typography>
        </div>
        <div className="mt-6 md:mt-0 z-10 bg-gray-800 p-4 rounded-xl border border-gray-700 min-w-[250px]">
           <div className="flex justify-between items-end mb-2">
             <Typography variant="overline" className="font-bold tracking-widest text-primary-400">Level {level}</Typography>
             <Typography variant="caption" className="font-mono text-gray-400">{currentXP} / {nextLevelXP} XP</Typography>
           </div>
           <LinearProgress variant="determinate" value={(currentXP/nextLevelXP)*100} sx={{ height: 10, borderRadius: 5, backgroundColor: '#374151', '& .MuiLinearProgress-bar': { backgroundColor: 'var(--primary-500)' } }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-sm border border-gray-100 dark:border-slate-700 flex items-center p-4 dark:bg-slate-800">
           <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mr-4"><LocalLibrary className="text-blue-600 dark:text-blue-400" /></div>
           <div>
              <Typography color="textSecondary" variant="body2" className="font-bold uppercase tracking-wider dark:text-slate-400">Courses</Typography>
              <Typography variant="h5" component="div" className="font-extrabold text-gray-900 dark:text-white">{courses.length}</Typography>
           </div>
        </Card>
        
        <Card 
          className="shadow-sm border border-gray-100 dark:border-slate-700 flex items-center p-4 dark:bg-slate-800 bg-indigo-50/20 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors group"
          onClick={() => navigate('/coding-challenges')}
        >
           <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full mr-4 group-hover:scale-110 transition-transform"><Code className="text-indigo-600 dark:text-indigo-400" /></div>
           <div>
              <Typography color="textSecondary" variant="body2" className="font-bold uppercase tracking-wider dark:text-slate-400">Coding Challenges</Typography>
              <Typography variant="h5" component="div" className="font-extrabold text-gray-900 dark:text-white">
                {quizzes.filter(q => q.hasCodingQuestions || q.title.toLowerCase().includes('coding')).length + 
                 assignments.filter(a => a.submissionType === 'CODE' || a.submissionType === 'code').length}
              </Typography>
           </div>
        </Card>
        
        <Card className="shadow-sm border border-gray-100 dark:border-slate-700 flex items-center p-4 dark:bg-slate-800">
           <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full mr-4"><EmojiEvents className="text-yellow-600 dark:text-yellow-400" /></div>
           <div>
              <Typography color="textSecondary" variant="body2" className="font-bold uppercase tracking-wider dark:text-slate-400">Total Badges</Typography>
              <Typography variant="h5" component="div" className="font-extrabold text-gray-900 dark:text-white">{badges.length + 3}</Typography>
           </div>
        </Card>

        <Card className="shadow-sm border border-gray-100 dark:border-slate-700 flex items-center p-4 bg-primary-50 dark:bg-primary-900/10">
           <div className="bg-primary-200 dark:bg-primary-900/30 p-3 rounded-full mr-4"><Star className="text-primary-700 dark:text-primary-300" /></div>
           <div>
              <Typography color="primary" variant="body2" className="font-bold uppercase tracking-wider dark:text-primary-400">Mastery</Typography>
              <Typography variant="h5" component="div" className="font-extrabold text-primary-900 dark:text-primary-100">12%</Typography>
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
         <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Your Curriculum</h3>
            {inProgressCourses.map((c, i) => (
              <Card key={i} className="shadow-sm border border-gray-100 dark:border-slate-700 cursor-pointer hover:shadow-md transition dark:bg-slate-800">
                <CardContent className="flex items-center">
                  <div className="flex-1">
                    <Typography variant="h6" className="font-semibold text-gray-800 dark:text-white">{c.title}</Typography>
                    <Typography color="textSecondary" className="mb-3 dark:text-slate-400">{c.category} • {c.estimatedDuration} Hours</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: '100%', mr: 2 }}>
                        <LinearProgress variant="determinate" value={0} sx={{ height: 8, borderRadius: 5, backgroundColor: darkMode ? '#374151' : '#e5e7eb' }} />
                      </Box>
                      <Box sx={{ minWidth: 35 }}>
                        <Typography variant="body2" className="font-bold text-primary-600 dark:text-primary-400">0%</Typography>
                      </Box>
                    </Box>
                  </div>
                  <div className="ml-6 pl-6 border-l border-gray-100 dark:border-slate-700 hidden md:block">
                     <Typography variant="body2" color="textSecondary" className="mb-1 dark:text-slate-400">Next Up:</Typography>
                     <Typography variant="body1" className="font-medium dark:text-slate-200">Module 1 Intro</Typography>
                  </div>
                </CardContent>
              </Card>
            ))}
            {inProgressCourses.length === 0 && (
              <Typography color="textSecondary" className="py-8 text-center bg-gray-50 dark:bg-slate-800/50 rounded border border-dashed border-gray-200 dark:border-slate-700 dark:text-slate-400">No specific courses active today. Head to the catalog!</Typography>
            )}
         </div>
         
         <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Achievements</h3>
            <Card className="shadow-sm border border-gray-100 dark:border-slate-700 p-6 dark:bg-slate-800">
                <div className="space-y-4">
                  {/* Rendering Hardcoded Spec Mockups for Gamification Engine visualization */}
                   <div className="flex items-center bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                      <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 p-2 rounded-full mr-4"><EmojiEvents /></div>
                      <div><Typography variant="subtitle2" className="font-bold dark:text-white">Quick Learner</Typography><Typography variant="caption" color="textSecondary" className="dark:text-slate-400">Complete 5 modules in 7 days</Typography></div>
                   </div>
                   <div className="flex items-center bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                      <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-2 rounded-full mr-4"><Star /></div>
                      <div><Typography variant="subtitle2" className="font-bold dark:text-white">Perfect Attendee</Typography><Typography variant="caption" color="textSecondary" className="dark:text-slate-400">Login 30 consecutive days</Typography></div>
                   </div>
                   <div className="flex items-center bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                      <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-full mr-4"><CheckCircle /></div>
                      <div><Typography variant="subtitle2" className="font-bold dark:text-white">Quiz Master</Typography><Typography variant="caption" color="textSecondary" className="dark:text-slate-400">Score 90%+ on 3 quizzes</Typography></div>
                   </div>
                </div>
            </Card>

            <h3 id="coding-arena" className="text-xl font-bold text-gray-900 dark:text-white mb-4 mt-8 flex items-center gap-2">
               <Code className="text-indigo-600" /> Top Coding Arena
            </h3>
            <Card className="shadow-sm border border-gray-100 dark:border-slate-700 p-6 dark:bg-slate-800 bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-800 dark:to-slate-900">
                <div className="space-y-3">
                   {[
                      ...quizzes.filter(q => q.hasCodingQuestions || q.title.toLowerCase().match(/coding|challenge|lab|algo|logic|dev/)).map(q => ({ ...q, itemType: 'QUIZ' })),
                      ...assignments.filter(a => (a.submissionType === 'CODE' || a.submissionType === 'code')).map(a => ({ ...a, itemType: 'ASSIGNMENT' }))
                   ].slice(0, 5).map((item, i) => (
                      <div key={item.id + i} className="flex items-center justify-between bg-white dark:bg-slate-700/50 rounded-xl p-3 border border-indigo-100 dark:border-indigo-900/30 shadow-sm hover:border-indigo-400 transition-all group">
                         <div className="flex items-center">
                            <div className="bg-indigo-600 text-white p-2 rounded-lg mr-4 font-black transition-transform group-hover:scale-110">{'<>'}</div>
                            <div>
                               <Typography variant="subtitle2" className="font-black dark:text-white uppercase tracking-tight">{item.title}</Typography>
                               <Typography variant="caption" color="textSecondary" className="dark:text-slate-400 font-bold flex items-center gap-1">
                                  {item.itemType === 'QUIZ' ? (
                                    <>⏱️ {item.timeLimit} Min • Auto-Grader</>
                                  ) : (
                                    <>🏗️ Project Lab • Monaco IDE</>
                                  )}
                               </Typography>
                            </div>
                         </div>
                         <Button 
                            size="small" 
                            variant="contained" 
                            className="bg-indigo-600 hover:bg-indigo-700 rounded-lg font-black text-[10px] min-w-[70px]" 
                            onClick={() => {
                               if (item.itemType === 'QUIZ') {
                                  navigate(`/quizzes/${item.id}/take`);
                               } else {
                                  navigate(`/student/assignments/${item.id}/ide`);
                               }
                            }}
                         >
                            SOLVE
                         </Button>
                      </div>
                   ))}
                   {(quizzes.filter(q => q.hasCodingQuestions || q.title.toLowerCase().match(/coding|challenge|lab|algo|logic|dev/)).length === 0 && 
                    assignments.filter(a => a.submissionType === 'CODE' || a.submissionType === 'code').length === 0) && (
                      <div className="text-center py-6">
                         <Typography variant="caption" className="text-gray-400 italic">No global coding challenges active. <br/>Check your curriculum for course-specific labs.</Typography>
                      </div>
                   )}
                </div>
            </Card>
         </div>
      </div>
    </div>
  );
}
