import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Paper, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, List, MenuItem } from '@mui/material';
import { api } from '../../utils/axiosConfig';
import TestCaseManager from '../../components/common/TestCaseManager';

export default function ManageQuizQuestions() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [openQ, setOpenQ] = useState(false);

  const [form, setForm] = useState({ 
     type: 'MCQ_SINGLE', 
     text: '', 
     options: '', 
     correctAnswer: '', 
     explanation: '', 
     points: 10, 
     orderIndex: 1,
     testCases: '',
     codeBoilerplate: ''
  });

  useEffect(() => {
    fetchData();
  }, [quizId]);

  const fetchData = async () => {
    try {
      // NOTE: Wait! `GET /api/v1/quizzes/{id}` isn't inherently globally mapped for staff, but we will test it.
      // Wait, let's just fetch the questions directly if the Quiz fetch fails to avoid breaking UI.
      const qRes = await api.get(`/quizzes/${quizId}/questions`);
      setQuestions(qRes.data || []);
      
      // Fallback: We can just get course quizzes from ManageCourseDetails and identify it, or assume title.
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async () => {
    try {
      await api.post(`/quizzes/${quizId}/questions`, form);
      setOpenQ(false);
      setForm({ ...form, text: '', options: '', correctAnswer: '', testCases: '', orderIndex: form.orderIndex + 1 });
      fetchData();
    } catch (err) { alert("Failed to add question to database."); }
  };

  if (loading) return <div className="flex justify-center p-20"><CircularProgress /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
         <div>
            <Typography variant="h4" className="font-bold text-gray-900">Quiz Question Architect</Typography>
            <Typography color="textSecondary">Build out the logic payloads for this specific exam container.</Typography>
         </div>
         <Button variant="outlined" onClick={() => navigate(-1)}>Back to Course Builder</Button>
      </div>

      <Paper className="p-6 border border-gray-100 shadow-sm">
         <div className="flex justify-between mb-4">
            <Typography variant="h6" className="font-bold">Evaluation Questions</Typography>
            <Button size="small" variant="contained" className="bg-primary-600 hover:bg-primary-700" onClick={() => setOpenQ(true)}>+ Add Question Node</Button>
         </div>

         {questions.length === 0 && <Typography color="textSecondary">No questions exist. Students will automatically pass.</Typography>}
         
         <List className="space-y-3 mt-4">
            {questions.map((q) => (
                <Paper key={q.id} className="bg-gray-50 border border-gray-200 p-4" elevation={0}>
                   <div className="flex justify-between items-start">
                      <div>
                        <Typography variant="subtitle1" className="font-bold border-b pb-2 mb-2">{q.orderIndex}. {q.type}</Typography>
                        <Typography variant="body1" className="mb-2">{q.text}</Typography>
                        {q.options && <Typography variant="caption" className="block text-gray-600">Options: {q.options}</Typography>}
                        {q.testCases && <Typography variant="caption" className="block text-gray-600 mt-1">Test Cases: {q.testCases}</Typography>}
                        <Typography variant="caption" className="block font-bold text-green-700 mt-2">Expected Answer Logic: {q.correctAnswer}</Typography>
                      </div>
                      <span className="bg-gray-200 text-gray-700 px-3 py-1 text-sm font-bold rounded-full">{q.points} Pts</span>
                   </div>
                </Paper>
            ))}
         </List>
      </Paper>

      {/* QUESTION DIALOG */}
      <Dialog open={openQ} onClose={() => setOpenQ(false)} maxWidth="md" fullWidth>
         <DialogTitle>Configure Question Model</DialogTitle>
         <DialogContent dividers className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TextField select label="Question Format" value={form.type} onChange={e => setForm({...form, type: e.target.value})} fullWidth>
                    <MenuItem value="MCQ_SINGLE">Standard Multiple Choice</MenuItem>
                    <MenuItem value="MCQ_MULTIPLE">Multi-Select Checkboxes</MenuItem>
                    <MenuItem value="TRUE_FALSE">True / False</MenuItem>
                    <MenuItem value="FILL_BLANKS">Fill in Blanks (Input)</MenuItem>
                    <MenuItem value="MATCHING">Drag & Drop Matching</MenuItem>
                    <MenuItem value="CODE">Monaco IDE Code Challenge</MenuItem>
                </TextField>
                <TextField type="number" label="Points Allowed" value={form.points} onChange={e => setForm({...form, points: parseInt(e.target.value)})} fullWidth />
                <TextField type="number" label="Order Sequence" value={form.orderIndex} onChange={e => setForm({...form, orderIndex: parseInt(e.target.value)})} fullWidth />
            </div>

            <TextField fullWidth multiline rows={3} label="Question Prompt / Challenge Definition" value={form.text} onChange={e => setForm({...form, text: e.target.value})} />
            
            {(form.type === 'MCQ_SINGLE' || form.type === 'MCQ_MULTIPLE' || form.type === 'MATCHING') && (
                <TextField fullWidth multiline rows={2} label="Options (JSON format array or CSV mapping)" placeholder='["Apple", "Banana", "Cherry"]' value={form.options} onChange={e => setForm({...form, options: e.target.value})} />
            )}
            
            <TextField fullWidth multiline rows={2} label={form.type === 'CODE' ? 'Expected CLI Output / Regex' : 'Validated Correct Answers'} placeholder={form.type === 'CODE' ? "Hello World" : "Apple"} value={form.correctAnswer} onChange={e => setForm({...form, correctAnswer: e.target.value})} />
            
            {form.type === 'CODE' && (
                <>
                   <TestCaseManager 
                      value={form.testCases} 
                      onChange={val => setForm({ ...form, testCases: val })} 
                   />
                   <TextField 
                      fullWidth 
                      multiline 
                      rows={4} 
                      label="Code Boilerplate / Starter Code" 
                      placeholder="e.g. public class Solution { ... }" 
                      value={form.codeBoilerplate} 
                      onChange={e => setForm({ ...form, codeBoilerplate: e.target.value })} 
                      sx={{ mt: 3, fontFamily: 'monospace' }}
                   />
                </>
            )}

            <TextField fullWidth label="Explanation (shown after grading)" value={form.explanation} onChange={e => setForm({...form, explanation: e.target.value})} />
         </DialogContent>
         <DialogActions>
            <Button onClick={handleAddQuestion} variant="contained" className="bg-primary-600" disabled={!form.text || !form.correctAnswer}>Append to Exam</Button>
         </DialogActions>
      </Dialog>
    </div>
  );
}
