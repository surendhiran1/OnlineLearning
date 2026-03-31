import { useState, useEffect } from 'react';
import { Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { api } from '../../utils/axiosConfig';

export default function ManageCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '', subtitle: '', description: '', thumbnailUrl: '', syllabus: '', learningObjectives: '', category: '', estimatedDuration: 10
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses');
      setCourses(res.data.content || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this course?")) {
      try {
        await api.delete(`/courses/${id}`);
        fetchCourses();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCreate = async () => {
    try {
      await api.post('/courses', formData);
      setOpen(false);
      setFormData({ title: '', subtitle: '', description: '', thumbnailUrl: '', syllabus: '', learningObjectives: '', category: '', estimatedDuration: 10 });
      fetchCourses();
    } catch (err) {
      console.error(err);
      alert('Failed to create course');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Typography variant="h4" className="font-bold text-gray-900 dark:text-white">Manage Courses</Typography>
          <Typography color="textSecondary">Create and administer your course catalog.</Typography>
        </div>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          className="bg-primary-600 hover:bg-primary-700"
          onClick={() => setOpen(true)}
        >
          Create Course
        </Button>
      </div>

      <TableContainer component={Paper} className="shadow-sm border border-gray-100 dark:border-slate-700">
        <Table>
          <TableHead className="bg-gray-50 dark:bg-slate-800">
            <TableRow>
              <TableCell className="font-semibold text-gray-700 dark:text-slate-100">Title</TableCell>
              <TableCell className="font-semibold text-gray-700 dark:text-slate-100">Category</TableCell>
              <TableCell className="font-semibold text-gray-700 dark:text-slate-100">Status</TableCell>
              <TableCell className="font-semibold text-gray-700 dark:text-slate-100">Duration</TableCell>
              <TableCell align="right" className="font-semibold text-gray-700 dark:text-slate-100">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                <TableCell>
                  <Typography variant="subtitle2" className="font-medium">{course.title}</Typography>
                  <Typography variant="body2" color="textSecondary">{course.subtitle}</Typography>
                </TableCell>
                <TableCell><Chip size="small" label={course.category} /></TableCell>
                <TableCell>
                  <Chip size="small" color={course.status === 'PUBLISHED' ? 'success' : 'default'} label={course.status} />
                </TableCell>
                <TableCell>{course.estimatedDuration}h</TableCell>
                <TableCell align="right">
                  <IconButton component={Link} to={`/courses/manage/${course.id}`} size="small" color="primary">
                    <SettingsIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(course.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            
            {courses.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" className="py-8 text-gray-500">
                  No courses found. Create your first course to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* CREATE COURSE DIALOG */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="font-bold">Create New Course</DialogTitle>
        <DialogContent dividers>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-1">
              <TextField fullWidth label="Course Title" name="title" value={formData.title} onChange={handleChange} required />
            </div>
            <div className="col-span-1 md:col-span-1">
              <TextField fullWidth label="Subtitle" name="subtitle" value={formData.subtitle} onChange={handleChange} />
            </div>
            <div className="col-span-1 md:col-span-1">
              <TextField fullWidth label="Category" name="category" value={formData.category} onChange={handleChange} required />
            </div>
            <div className="col-span-1 md:col-span-1">
              <TextField fullWidth type="number" label="Estimated Duration (hours)" name="estimatedDuration" value={formData.estimatedDuration} onChange={handleChange} required />
            </div>
            <div className="col-span-1 md:col-span-2">
              <TextField fullWidth label="Thumbnail URL" name="thumbnailUrl" value={formData.thumbnailUrl} onChange={handleChange} placeholder="https://..." />
            </div>
            <div className="col-span-1 md:col-span-2">
              <TextField fullWidth multiline rows={3} label="Course Description" name="description" value={formData.description} onChange={handleChange} />
            </div>
            <div className="col-span-1 md:col-span-2">
              <TextField fullWidth multiline rows={3} label="Syllabus" name="syllabus" value={formData.syllabus} onChange={handleChange} placeholder="Chapter 1... Chapter 2..." />
            </div>
            <div className="col-span-1 md:col-span-2">
               <TextField fullWidth multiline rows={2} label="Learning Objectives" name="learningObjectives" value={formData.learningObjectives} onChange={handleChange} placeholder="JSON format or plain text bullets" />
            </div>
          </div>
        </DialogContent>
        <DialogActions className="p-4">
          <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleCreate} variant="contained" className="bg-primary-600 hover:bg-primary-700" disabled={!formData.title || !formData.category}>
            Publish Course
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
