import { useState, useEffect, useRef } from 'react';
import { Typography, Paper, Button, Chip, CircularProgress, Alert, Snackbar } from '@mui/material';
import { CloudUpload as UploadIcon, CheckCircle as DoneIcon } from '@mui/icons-material';
import { api } from '../../utils/axiosConfig';

export default function Assignments() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<number | null>(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeAssignId, setActiveAssignId] = useState<number | null>(null);

  useEffect(() => {
    const fetchAllAssignments = async () => {
      try {
        const coursesRes = await api.get('/courses');
        const courses = coursesRes.data.content || [];
        
        let allAssignments: any[] = [];
        for (const course of courses) {
          try {
            const assignRes = await api.get(`/courses/${course.id}/assignments`);
            const courseAssignments = await Promise.all(assignRes.data.map(async (a: any) => {
              // Check for student's own submission for each assignment
              let submission = null;
              try {
                const subRes = await api.get(`/assignments/${a.id}/submissions/me`);
                submission = subRes.data;
              } catch (e) {}

              return {
                ...a,
                courseName: course.title,
                submission: submission
              };
            }));
            allAssignments = [...allAssignments, ...courseAssignments];
          } catch (e) {}
        }
        setAssignments(allAssignments);
      } catch (err) {
        console.error("Failed to fetch assignments", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllAssignments();
  }, []);

  const handleUploadTrigger = (id: number) => {
    setActiveAssignId(id);
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeAssignId) return;

    setUploading(activeAssignId);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/assignments/${activeAssignId}/submissions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setToast({ open: true, message: 'Assignment submitted successfully!', severity: 'success' });
    } catch (err: any) {
      setToast({ open: true, message: err.response?.data?.message || 'Upload failed', severity: 'error' });
    } finally {
      setUploading(null);
      setActiveAssignId(null);
      if (e.target) e.target.value = '';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><CircularProgress /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <Typography variant="h4" className="font-bold text-gray-900 dark:text-white">Assignments</Typography>
        <Typography color="textSecondary" className="dark:text-slate-400">Manage your course submissions and deliverables.</Typography>
      </div>

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.zip"
      />

      <div className="grid grid-cols-1 gap-4">
        {assignments.map(assignment => (
          <Paper key={assignment.id} className="p-6 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 dark:bg-slate-800">
            <div className="flex-1">
              <div className="flex items-center mb-1 space-x-2">
                <Typography variant="h6" className="font-bold text-gray-900 dark:text-white">{assignment.title}</Typography>
                <Chip 
                  size="small" 
                  label={assignment.submissionType || "FILE"} 
                  color="secondary" 
                  variant="outlined" 
                />
              </div>
              <Typography variant="body2" color="primary" className="font-medium mb-1 dark:text-primary-400">
                Course: {assignment.courseName}
              </Typography>
              <Typography variant="body2" color="textSecondary" className="dark:text-slate-400">
                Due: {new Date(assignment.dueDate).toLocaleDateString()} | Points: {assignment.points}
              </Typography>
              
              <Typography variant="body2" className="mt-2 text-gray-600 dark:text-slate-400 italic">
                {assignment.description}
              </Typography>
            </div>

            <div>
               {assignment.submission ? (
                 <div className="flex flex-col items-center gap-2">
                   <Chip 
                    label={assignment.submission.status || "SUBMITTED"} 
                    color={assignment.submission.status === 'GRADED' ? 'success' : 'info'} 
                    variant="filled" 
                    icon={<DoneIcon />}
                   />
                   {assignment.submission.feedback && (
                     <Typography variant="caption" className="text-gray-500 max-w-[200px] text-center">
                       Feedback: {assignment.submission.feedback}
                     </Typography>
                   )}
                 </div>
               ) : (
                 <Button 
                  variant="contained" 
                  className="bg-primary-600 hover:bg-primary-700 min-w-[180px]" 
                  startIcon={uploading === assignment.id ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
                  onClick={() => handleUploadTrigger(assignment.id)}
                  disabled={uploading !== null}
                 >
                   {uploading === assignment.id ? 'Uploading...' : 'Submit assignment'}
                 </Button>
               )}
            </div>
          </Paper>
        ))}
        {assignments.length === 0 && (
          <Typography color="textSecondary" className="py-8 text-center bg-gray-50 dark:bg-slate-800 dark:text-slate-400 rounded-xl">No assignments found across any course.</Typography>
        )}
      </div>

      <Snackbar 
        open={toast.open} 
        autoHideDuration={4000} 
        onClose={() => setToast({ ...toast, open: false })}
      >
        <Alert severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
