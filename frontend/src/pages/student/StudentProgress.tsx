import { useState, useEffect } from 'react';
import { Typography, Paper, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button } from '@mui/material';
import { api } from '../../utils/axiosConfig';

export default function StudentProgress() {
  const [progressData, setProgressData] = useState<any[]>([]);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await api.get('/progress');
        setProgressData(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProgress();
  }, []);

  const totalTimeSpent = progressData.reduce((acc, curr) => acc + (curr.timeSpent || 0), 0);
  const completedItems = progressData.filter(item => item.isCompleted).length;

  const downloadReport = (format: 'csv' | 'json') => {
    let content = '';
    let mimeType = '';
    let filename = `learning-report-${new Date().toISOString().split('T')[0]}`;

    if (format === 'csv') {
       mimeType = 'text/csv;charset=utf-8;';
       filename += '.csv';
       content = 'Material ID,Completion Status,Time Spent (mins),Progress %,Last Accessed\n';
       content += progressData.map(p => 
          `${p.materialId},${p.isCompleted ? 'Completed' : 'In Progress'},${Math.floor((p.timeSpent||0)/60)},${p.progress||(p.isCompleted?100:50)},${new Date(p.updatedAt).toLocaleDateString()}`
       ).join('\n');
    } else {
       mimeType = 'application/json;charset=utf-8;';
       filename += '.json';
       content = JSON.stringify(progressData, null, 2);
    }

    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="mb-4 flex flex-col md:flex-row justify-between md:items-center">
        <div>
          <Typography variant="h4" className="font-bold text-gray-900 dark:text-white">Learning Progress</Typography>
          <Typography color="textSecondary" className="dark:text-slate-400">Track your viewing history and completion rates.</Typography>
        </div>
        
        <div className="mt-4 md:mt-0 flex space-x-3">
           <Button 
             variant="outlined" 
             className="bg-white dark:bg-slate-800 border-primary-600 text-primary-600 dark:text-primary-400 font-semibold"
             onClick={() => downloadReport('csv')}
           >
             Export CSV
           </Button>
           <Button 
             variant="outlined" 
             className="bg-white dark:bg-slate-800 border-primary-600 text-primary-600 dark:text-primary-400 font-semibold"
             onClick={() => downloadReport('json')}
           >
             Export JSON
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Paper className="p-6 border border-gray-100 dark:border-slate-700 shadow-sm bg-gradient-to-br from-primary-50 to-white dark:from-slate-800 dark:to-slate-900">
          <Typography color="primary" className="font-semibold mb-2 dark:text-primary-400">Total Time Learning</Typography>
          <Typography variant="h3" className="font-bold text-gray-900 dark:text-white">
            {Math.floor(totalTimeSpent / 3600)}h {Math.floor((totalTimeSpent % 3600) / 60)}m
          </Typography>
        </Paper>
        <Paper className="p-6 border border-gray-100 dark:border-slate-700 shadow-sm bg-gradient-to-br from-green-50 to-white dark:from-slate-800 dark:to-slate-900">
          <Typography color="success.main" className="font-semibold mb-2">Materials Completed</Typography>
          <Typography variant="h3" className="font-bold text-gray-900 dark:text-white">
            {completedItems} <span className="text-lg text-gray-500 dark:text-slate-400 font-normal">items</span>
          </Typography>
        </Paper>
      </div>

      <Typography variant="h6" className="font-bold mt-8 mb-4 dark:text-white">Material History</Typography>
      <TableContainer component={Paper} className="shadow-sm border border-gray-100 dark:border-slate-700">
        <Table>
          <TableHead className="bg-gray-50 dark:bg-slate-800">
            <TableRow>
              <TableCell className="font-semibold text-gray-700 dark:text-slate-100">Material ID</TableCell>
              <TableCell className="font-semibold text-gray-700 dark:text-slate-100">Completion Status</TableCell>
              <TableCell className="font-semibold text-gray-700 dark:text-slate-100">Time Spent</TableCell>
              <TableCell className="font-semibold text-gray-700 dark:text-slate-100">Last Accessed</TableCell>
              <TableCell className="font-semibold text-gray-700 dark:text-slate-100">Progress</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {progressData.map((prog, idx) => (
              <TableRow key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                <TableCell className="font-medium text-gray-900 dark:text-white">#{prog.materialId}</TableCell>
                <TableCell>
                  <Chip 
                    size="small" 
                    color={prog.isCompleted ? 'success' : 'warning'} 
                    label={prog.isCompleted ? 'Completed' : 'In Progress'} 
                  />
                </TableCell>
                <TableCell>{Math.floor((prog.timeSpent || 0) / 60)} mins</TableCell>
                <TableCell>{new Date(prog.updatedAt).toLocaleDateString()}</TableCell>
                <TableCell className="w-48">
                  <div className="flex items-center">
                    <div className="w-full mr-2">
                      <LinearProgress 
                        variant="determinate" 
                        value={prog.progress || (prog.isCompleted ? 100 : 50)} 
                        color={prog.isCompleted ? 'success' : 'primary'}
                      />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                      {prog.progress || (prog.isCompleted ? 100 : 50)}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            
            {progressData.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" className="py-8 text-gray-500">
                  No learning activity recorded yet. Start a course to see your progress!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
