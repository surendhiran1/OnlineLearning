import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Paper, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, List, ListItem, ListItemButton, ListItemText, ListItemSecondaryAction, Chip } from '@mui/material';

import { api } from '../../utils/axiosConfig';
import CourseChat from '../../components/chat/CourseChat';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function ManageCourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  const [openModule, setOpenModule] = useState(false);
  const [openQuiz, setOpenQuiz] = useState(false);
  const [openAssignment, setOpenAssignment] = useState(false);
  const [openMaterial, setOpenMaterial] = useState(false);
  const [selModuleId, setSelModuleId] = useState<number | null>(null);
  const [modMaterials, setModMaterials] = useState<Record<number, any[]>>({});

  // Forms
  const [modForm, setModForm] = useState({ title: '', description: '', orderIndex: 1 });
  const [matForm, setMatForm] = useState({ title: '', file: null as File | null });
  const [quizForm, setQuizForm] = useState({ 
    title: '', 
    description: '', 
    timeLimit: 30, 
    passingScore: 70, 
    attemptsAllowed: 3, 
    shuffleQuestions: true,
    showAnswers: 'MANUAL'
  });
  const defaultDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const [assignForm, setAssignForm] = useState({ title: '', description: '', points: 100, submissionType: 'FILE', plagiarismCheck: false, dueDate: defaultDueDate });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [cRes, mRes, qRes, aRes] = await Promise.all([
         api.get(`/courses/${id}`),
         api.get(`/courses/${id}/modules`),
         api.get(`/courses/${id}/quizzes`),
         api.get(`/courses/${id}/assignments`)
      ]);
      setCourse(cRes.data);
      const mods = mRes.data || [];
      setModules(mods);
      setQuizzes(qRes.data || []);
      setAssignments(aRes.data || []);

      // Fetch materials for each module
      const matMap: Record<number, any[]> = {};
      await Promise.all(mods.map(async (m: any) => {
        const res = await api.get(`/modules/${m.id}/materials`);
        matMap[m.id] = res.data || [];
      }));
      setModMaterials(matMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadMaterial = async () => {
    if (!selModuleId || !matForm.file) return;
    const fd = new FormData();
    fd.append('title', matForm.title);
    fd.append('file', matForm.file);

    try {
      await api.post(`/modules/${selModuleId}/materials/upload`, fd, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setOpenMaterial(false);
      setMatForm({ title: '', file: null });
      fetchData();
    } catch (e: any) { 
      console.error(e);
      alert(`Upload failed: ${e.response?.data?.message || 'Check constraints or size limits'}`); 
    }
  };

  const handleCreateModule = async () => {
    try { await api.post(`/courses/${id}/modules`, modForm); setOpenModule(false); fetchData(); } catch (err) { alert("Failed to add module"); }
  };

  const handleCreateQuiz = async () => {
    const payload = {
      ...quizForm,
      passingScore: isNaN(quizForm.passingScore) ? 70 : quizForm.passingScore,
      timeLimit: isNaN(quizForm.timeLimit) ? 30 : quizForm.timeLimit
    };
    try { 
       await api.post(`/courses/${id}/quizzes`, payload); 
       setOpenQuiz(false); 
       fetchData(); 
    } catch (err) { 
       alert("Failed to add quiz. Ensure title is unique for this course."); 
    }
  };

  const handleCreateAssignment = async () => {
    try { await api.post(`/courses/${id}/assignments`, assignForm); setOpenAssignment(false); fetchData(); } catch (err) { alert("Failed to add Assignment"); }
  };

  const handleDownloadCourseReport = async (format: 'pdf' | 'xlsx') => {
     try {
        const [subRes, userRes] = await Promise.all([
           api.get('/reports/submissions'),
           api.get('/users/all')
        ]);
        
        const allSubs = subRes.data || [];
        const students = (userRes.data || []).filter((u: any) => u.role === 'STUDENT');
        
        const courseAssignmentIds = assignments.map(a => a.id);
        const courseQuizIds = quizzes.map(q => q.id);

        const courseSubs = allSubs.filter((sub: any) => 
           (sub.assignmentId && courseAssignmentIds.includes(sub.assignmentId)) || 
           (sub.quizId && courseQuizIds.includes(sub.quizId))
        );

        const reportData = courseSubs.map((sub: any) => {
           const student = students.find((s: any) => s.id === sub.userId);
           let itemName = "Unknown";
           if (sub.quizId) itemName = quizzes.find(q => q.id === sub.quizId)?.title || "Quiz";
           else if (sub.assignmentId) itemName = assignments.find(a => a.id === sub.assignmentId)?.title || "Assignment";
           
           return {
              courseName: course?.title || "Course",
              itemName,
              studentName: student?.fullName || "Student",
              submissionDate: sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "Real-time Date",
              status: sub.status || "SUBMITTED",
              points: sub.score || 0
           };
        });

        const filename = `course-report-${course?.title.toLowerCase().replace(/ /g, '-')}-${new Date().toISOString().split('T')[0]}`;

        if (format === 'pdf') {
           const doc = new jsPDF('landscape');
           doc.text(`Real-time Course Audit: ${course?.title}`, 14, 15);
           autoTable(doc, {
              startY: 20,
              head: [['Course Name', 'Assignment / Quiz Name', 'Student Name', 'Submission Date & Time', 'Status', 'Points / Score']],
              body: reportData.map((d: any) => [d.courseName, d.itemName, d.studentName, d.submissionDate, d.status, d.points]),
           });
           doc.save(`${filename}.pdf`);
        } else {
           const ws = XLSX.utils.json_to_sheet(reportData.map((d: any) => ({
              "Course Name": d.courseName,
              "Assignment / Quiz Name": d.itemName,
              "Student Name": d.studentName,
              "Submission Date & Time": d.submissionDate,
              "Status": d.status,
              "Points / Score": d.points
           })));
           const wb = XLSX.utils.book_new();
           XLSX.utils.book_append_sheet(wb, ws, "Submissions");
           XLSX.writeFile(wb, `${filename}.xlsx`);
        }
     } catch (err) {
        alert("Failed to generate report. Data link error.");
     }
  };

  if (loading) return <div className="flex items-center justify-center p-20"><CircularProgress /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
         <div>
            <Typography variant="h4" className="font-bold text-gray-900">Course Architect: {course?.title}</Typography>
            <Typography color="textSecondary">Manage Syllabus, Quizzes, Gamification elements, and Materials.</Typography>
         </div>
         <div className="flex space-x-3">
            <Button 
               variant="contained" 
               className="bg-primary-600 font-semibold shadow-sm"
               onClick={() => handleDownloadCourseReport('pdf')}
            >
               Course PDF Report
            </Button>
            <Button 
               variant="contained" 
               style={{ backgroundColor: '#2e7d32' }}
               className="font-semibold shadow-sm text-white"
               onClick={() => handleDownloadCourseReport('xlsx')}
            >
               Course XLSX
            </Button>
            <Button variant="outlined" onClick={() => navigate('/courses/manage')}>Back</Button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* MODULES LIST */}
         <Paper className="p-6 border border-gray-100 shadow-sm col-span-1 md:col-span-2">
            <div className="flex justify-between mb-4">
              <Typography variant="h6" className="font-bold">📘 Course Modules & Materials</Typography>
              <Button size="small" variant="contained" className="bg-primary-600" onClick={() => setOpenModule(true)}>+ Add Module</Button>
            </div>
            {modules.length === 0 && <Typography color="textSecondary">No modules created yet. Build your syllabus.</Typography>}
            <List className="space-y-3">
              {modules.map(mod => (
                 <Paper key={mod.id} className="bg-gray-50 border border-gray-200" elevation={0}>
                    <ListItem className="block">
                      <div className="flex justify-between items-center w-full">
                        <ListItemText primary={<span className="font-bold">{mod.orderIndex}. {mod.title}</span>} secondary={mod.description} />
                        <div className="flex gap-2">
                           <Button size="small" variant="outlined" color="primary" onClick={() => { setSelModuleId(mod.id); setOpenMaterial(true); }}>+ Material</Button>
                        </div>
                      </div>
                      
                      {/* Sub-list for Materials */}
                      <div className="ml-4 mt-2 pl-4 border-l-2 border-gray-100">
                         {modMaterials[mod.id]?.map((mat: any) => (
                           <div key={mat.id} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                             <Typography variant="body2" className="text-gray-700">📄 {mat.title}</Typography>
                             <Chip label={mat.type} size="small" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
                           </div>
                         ))}
                      </div>
                    </ListItem>
                 </Paper>
              ))}
            </List>
         </Paper>

         {/* QUIZZES */}
         <Paper className="p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between mb-4">
              <Typography variant="h6" className="font-bold">📝 Interactive Quizzes</Typography>
              <Button size="small" variant="contained" className="bg-primary-600" onClick={() => setOpenQuiz(true)}>+ Add Quiz</Button>
            </div>
            {quizzes.length === 0 && <Typography color="textSecondary">No interactive quizzes.</Typography>}
            <List className="space-y-2">
               {quizzes.map(q => (
                 <Paper key={q.id} className="border border-gray-100" elevation={0}>
                   <ListItem disablePadding>
                     <ListItemButton onClick={() => navigate(`/courses/manage/quizzes/${q.id}`)} className="cursor-pointer hover:bg-gray-50 pr-32">
                       <ListItemText primary={q.title} secondary={`Pass: ${q.passingScore}% | Limit: ${q.timeLimit}m`} />
                     </ListItemButton>
                     <ListItemSecondaryAction>
                        <Chip label="Build Questions ->" color="primary" size="small" onClick={() => navigate(`/courses/manage/quizzes/${q.id}`)} className="cursor-pointer" />
                     </ListItemSecondaryAction>
                   </ListItem>
                 </Paper>
               ))}
            </List>
         </Paper>

         {/* ASSIGNMENTS */}
         <Paper className="p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between mb-4">
              <Typography variant="h6" className="font-bold">📋 Submittable Assignments</Typography>
              <Button size="small" variant="contained" className="bg-primary-600" onClick={() => setOpenAssignment(true)}>+ Add Assignment</Button>
            </div>
            {assignments.length === 0 && <Typography color="textSecondary">No manual assignments.</Typography>}
            <List className="space-y-2">
                {assignments.map(a => (
                  <Paper key={a.id} className="border border-gray-100 mb-2" elevation={0}>
                    <ListItem>
                      <ListItemText primary={a.title} secondary={`${a.points} Points | Format: ${a.submissionType}`} />
                      <ListItemSecondaryAction>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="info" 
                          onClick={() => navigate(`/instructor/assignments/${a.id}/submissions`)}
                          className="font-bold border-2"
                        >
                          View Submissions
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </Paper>
                ))}
            </List>
         </Paper>

         {/* LIVE CHAT */}
         <div className="col-span-1 md:col-span-2 mt-4">
             <Paper className="p-6 border border-gray-100 shadow-sm">
               <Typography variant="h6" className="font-bold mb-4">💬 Live Class Discussion Stream</Typography>
               <CourseChat courseId={Number(id)} />
             </Paper>
         </div>
      </div>

      {/* DIALOGS */}
      <Dialog open={openModule} onClose={() => setOpenModule(false)} maxWidth="sm" fullWidth>
         <DialogTitle>Add New Module</DialogTitle>
         <DialogContent dividers className="space-y-4">
            <TextField fullWidth label="Module Title" value={modForm.title} onChange={e => setModForm({...modForm, title: e.target.value})} />
            <TextField fullWidth multiline rows={2} label="Description" value={modForm.description} onChange={e => setModForm({...modForm, description: e.target.value})} />
            <TextField fullWidth type="number" label="Order Sequence" value={modForm.orderIndex} onChange={e => setModForm({...modForm, orderIndex: parseInt(e.target.value)})} />
         </DialogContent>
         <DialogActions><Button onClick={handleCreateModule} variant="contained" disabled={!modForm.title}>Save Module</Button></DialogActions>
      </Dialog>
      <Dialog open={openQuiz} onClose={() => setOpenQuiz(false)} maxWidth="sm" fullWidth>
         <DialogTitle>Create Validated Quiz</DialogTitle>
         <DialogContent dividers className="space-y-4">
            <TextField fullWidth label="Quiz Title" value={quizForm.title} onChange={e => setQuizForm({...quizForm, title: e.target.value})} />
            <TextField fullWidth label="Description" value={quizForm.description} onChange={e => setQuizForm({...quizForm, description: e.target.value})} />
            <div className="flex space-x-4"><TextField type="number" label="Time Limit (min)" value={quizForm.timeLimit} onChange={e => setQuizForm({...quizForm, timeLimit: parseInt(e.target.value)})} /><TextField type="number" label="Passing Score" value={quizForm.passingScore} onChange={e => setQuizForm({...quizForm, passingScore: parseFloat(e.target.value)})} /></div>
         </DialogContent>
         <DialogActions><Button onClick={handleCreateQuiz} variant="contained" disabled={!quizForm.title}>Create Quiz</Button></DialogActions>
      </Dialog>
      <Dialog open={openAssignment} onClose={() => setOpenAssignment(false)} maxWidth="sm" fullWidth>
         <DialogTitle>Attach Assignment Block</DialogTitle>
         <DialogContent dividers className="space-y-4">
            <TextField fullWidth label="Assignment Title" value={assignForm.title} onChange={e => setAssignForm({...assignForm, title: e.target.value})} />
            <div className="flex items-center space-x-4 mt-2">
               <TextField type="number" label="Points Yield" value={assignForm.points} onChange={e => setAssignForm({...assignForm, points: parseInt(e.target.value)})} />
               <select className="border border-gray-300 rounded p-4 h-[56px]" value={assignForm.submissionType} onChange={e => setAssignForm({...assignForm, submissionType: e.target.value})}>
                  <option value="FILE">File Upload</option>
                  <option value="LINK">URL Link</option>
               </select>
               <TextField 
                  type="datetime-local" 
                  label="Due Date"
                  InputLabelProps={{ shrink: true }}
                  value={assignForm.dueDate} 
                  onChange={e => setAssignForm({...assignForm, dueDate: e.target.value})} 
                  className="flex-grow"
               />
            </div>
         </DialogContent>
         <DialogActions><Button onClick={handleCreateAssignment} variant="contained" disabled={!assignForm.title}>Create Submittable</Button></DialogActions>
      </Dialog>

      <Dialog open={openMaterial} onClose={() => setOpenMaterial(false)} maxWidth="sm" fullWidth>
         <DialogTitle>Teacher Upload: Module Resource</DialogTitle>
         <DialogContent dividers className="space-y-4">
            <TextField fullWidth label="Material Name (e.g. Week 1 Lecture PDF)" value={matForm.title} onChange={e => setMatForm({...matForm, title: e.target.value})} />
            <input type="file" onChange={e => setMatForm({...matForm, file: e.target.files?.[0] || null})} />
            <Typography variant="caption" className="block text-gray-500">Allowed: .pdf, .mp4, .zip, .docx, .png</Typography>
         </DialogContent>
         <DialogActions><Button onClick={handleUploadMaterial} variant="contained" disabled={!matForm.title || !matForm.file}>Upload to Module</Button></DialogActions>
      </Dialog>
    </div>
  );
}
