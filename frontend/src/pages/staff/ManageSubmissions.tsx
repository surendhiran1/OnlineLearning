import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Paper, Button, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Box, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { Download as DownloadIcon, CheckCircle as GradeIcon, ArrowBack } from '@mui/icons-material';
import { api } from '../../utils/axiosConfig';

export default function ManageSubmissions() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [openGradeDialog, setOpenGradeDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [gradeForm, setGradeForm] = useState({ xpAwarded: 0, feedback: '' });

  useEffect(() => {
    fetchSubmissions();
  }, [assignmentId]);

  const fetchSubmissions = async () => {
      try {
        const res = await api.get(`/assignments/${assignmentId}/submissions`);
        setSubmissions(res.data || []);
      } catch (err) {
        console.error("Failed to fetch submissions", err);
      } finally {
        setLoading(false);
      }
    };

  const handleDownload = async (submission: any) => {
    const fileName = submission.metadata?.fileName;
    const originalName = submission.metadata?.originalFileName || 'submission';
    
    if (!fileName) {
      alert("No file found for this submission.");
      return;
    }
    
    try {
      // Use api.get to ensure Authorization headers are included
      // We pass the original Name as a query param so the server can set the header correctly
      const response = await api.get(`/assignments/${assignmentId}/submissions/download/${fileName}`, {
        params: { orig: originalName },
        responseType: 'blob'
      });
      
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
      alert("Failed to download file. Please check your permissions.");
    }
  };

  const submitGrade = async () => {
    if (!selectedSubmission) return;
    try {
      await api.put(`/assignments/${assignmentId}/submissions/${selectedSubmission.id}/grade`, gradeForm);
      setOpenGradeDialog(false);
      fetchSubmissions();
    } catch (e) { alert("Failed to save grade"); }
  };

  if (loading) return <Box className="flex justify-center p-20"><CircularProgress /></Box>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <IconButton onClick={() => navigate(-1)}><ArrowBack /></IconButton>
        <div>
          <Typography variant="h5" className="font-bold">Student Submissions</Typography>
          <Typography color="textSecondary">Review and grade assignment uploads</Typography>
        </div>
      </div>

      <TableContainer component={Paper} className="shadow-none border border-gray-100 rounded-xl overflow-hidden">
        <Table>
          <TableHead className="bg-gray-50">
            <TableRow>
              <TableCell className="font-bold">Student Name</TableCell>
              <TableCell className="font-bold">Submitted Date</TableCell>
              <TableCell className="font-bold">Status</TableCell>
              <TableCell className="font-bold">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submissions.map((sub) => (
              <TableRow key={sub.id} hover>
                <TableCell>
                  <Typography variant="body2" className="font-medium text-gray-900">{sub.fullName}</Typography>
                  <Typography variant="caption" color="textSecondary">ID: #{sub.userId}</Typography>
                </TableCell>
                <TableCell>{new Date(sub.submittedAt).toLocaleString()}</TableCell>
                <TableCell>
                  <Chip 
                    label={sub.status} 
                    color={sub.status === 'GRADED' ? 'success' : 'warning'} 
                    size="small" 
                    className="font-bold"
                  />
                </TableCell>
                <TableCell className="space-x-2">
                  <Button 
                    startIcon={<DownloadIcon />} 
                    size="small" 
                    variant="contained" 
                    className="bg-blue-600 capitalize rounded-lg"
                    onClick={() => handleDownload(sub)}
                  >
                    Download
                  </Button>
                  <Button 
                    startIcon={<GradeIcon />} 
                    size="small" 
                    variant="outlined" 
                    className="border-green-600 text-green-600 capitalize rounded-lg"
                    onClick={() => {
                        setSelectedSubmission(sub);
                        setGradeForm({ xpAwarded: sub.score || 0, feedback: sub.feedback || '' });
                        setOpenGradeDialog(true);
                    }}
                  >
                    Grade
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {submissions.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-gray-500 italic">
                  No submissions yet for this assignment.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Grading Dialog */}
      <Dialog open={openGradeDialog} onClose={() => setOpenGradeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Evaluate Submission</DialogTitle>
        <DialogContent dividers className="space-y-4">
           {selectedSubmission && (
              <div className="bg-gray-50 p-3 rounded border border-gray-100 mb-4">
                 <Typography variant="body2" className="font-bold text-gray-900">Grading: {selectedSubmission.fullName}</Typography>
                 <Typography variant="caption" color="textSecondary">Submitted on: {new Date(selectedSubmission.submittedAt).toLocaleString()}</Typography>
              </div>
           )}
           <TextField 
              fullWidth 
              type="number" 
              label="XP / Points to Award" 
              value={gradeForm.xpAwarded} 
              onChange={e => setGradeForm({...gradeForm, xpAwarded: Number(e.target.value)})} 
           />
           <TextField 
              fullWidth 
              multiline 
              rows={4} 
              label="Instructor Feedback" 
              value={gradeForm.feedback} 
              onChange={e => setGradeForm({...gradeForm, feedback: e.target.value})} 
              placeholder="Great job on this assignment. One area to improve..."
           />
        </DialogContent>
        <DialogActions>
           <Button onClick={() => setOpenGradeDialog(false)} color="inherit">Cancel</Button>
           <Button onClick={submitGrade} variant="contained" className="bg-green-600 hover:bg-green-700" disabled={gradeForm.xpAwarded < 0}>
             Save Grade
           </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
