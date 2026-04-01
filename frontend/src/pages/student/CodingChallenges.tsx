import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Button, Chip, LinearProgress } from '@mui/material';
import { Code, Timer, Terminal, EmojiEvents } from '@mui/icons-material';
import { api } from '../../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';

export default function CodingChallenges() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [qRes, aRes] = await Promise.all([
          api.get('/quizzes/all'),
          api.get('/assignments/all')
        ]);
        setQuizzes(qRes.data || []);
        setAssignments(aRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const codingQuizzes = quizzes.filter(q => q.hasCodingQuestions || q.title.toLowerCase().match(/coding|challenge|lab|algo|logic|dev/));
  const codingAssignments = assignments.filter(a => a.submissionType === 'CODE' || a.submissionType === 'code');

  const allChallenges = [
    ...codingQuizzes.map(q => ({ ...q, type: 'QUIZ' })),
    ...codingAssignments.map(a => ({ ...a, type: 'ASSIGNMENT' }))
  ];

  if (loading) {
    return <LinearProgress className="mt-8" />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="bg-indigo-900 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500 rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/3"></div>
        <div className="z-10 relative">
          <Typography variant="h3" className="font-black mb-3">Coding Arena</Typography>
          <Typography variant="h6" className="text-indigo-200 max-w-2xl font-medium">
            Sharpen your skills with real-world coding challenges, algorithm puzzles, and logic games. 
            Earn XP and climb the leaderboard!
          </Typography>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allChallenges.map((item, index) => (
          <Card 
            key={index} 
            className="group hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-slate-700 dark:bg-slate-800 rounded-2xl overflow-hidden flex flex-col"
          >
            <div className="h-2 bg-indigo-600"></div>
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <Code />
                </div>
                <Chip 
                  label={item.type === 'QUIZ' ? 'Auto-Grader' : 'Project Lab'} 
                  size="small" 
                  className={item.type === 'QUIZ' ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-blue-100 text-blue-700 font-bold'}
                />
              </div>
              
              <Typography variant="h6" className="font-black mb-1 dark:text-white line-clamp-1">
                {item.title}
              </Typography>
              <Typography variant="body2" className="text-gray-500 dark:text-slate-400 mb-6 line-clamp-2">
                {item.description || "Challenge your coding skills and earn badges by solving this problem."}
              </Typography>
              
              <div className="space-y-3 mb-8 flex-1">
                <div className="flex items-center text-sm font-bold text-gray-700 dark:text-slate-300">
                  <Timer className="mr-2 text-primary-500" fontSize="small" />
                  {item.type === 'QUIZ' ? `${item.timeLimit} Minutes` : 'Flexible Timing'}
                </div>
                <div className="flex items-center text-sm font-bold text-gray-700 dark:text-slate-300">
                  <Terminal className="mr-2 text-indigo-500" fontSize="small" />
                  {item.type === 'QUIZ' ? 'Algorithm Challenge' : 'Code Architecture'}
                </div>
                <div className="flex items-center text-sm font-bold text-gray-700 dark:text-slate-300">
                  <EmojiEvents className="mr-2 text-yellow-500" fontSize="small" />
                  50 XP Reward
                </div>
              </div>

              <Button 
                fullWidth 
                variant="contained" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl transform active:scale-95 transition-transform"
                onClick={() => {
                  if (item.type === 'QUIZ') {
                    navigate(`/quizzes/${item.id}/take`);
                  } else {
                    navigate(`/student/assignments/${item.id}/ide`);
                  }
                }}
              >
                START CHALLENGE
              </Button>
            </CardContent>
          </Card>
        ))}
        
        {allChallenges.length === 0 && (
          <div className="col-span-full py-20 text-center bg-gray-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-700">
            <Code className="text-gray-300" sx={{ fontSize: 60 }} />
            <Typography variant="h6" className="mt-4 text-gray-500 dark:text-slate-400 font-bold">
              No Coding Challenges Available Right Now
            </Typography>
            <Typography variant="body2" className="text-gray-400">
              Check back later or explore other courses.
            </Typography>
          </div>
        )}
      </div>
    </div>
  );
}
