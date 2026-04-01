import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Breadcrumbs, Link, Typography, Button, Paper, CircularProgress, Chip, Dialog, DialogTitle, DialogContent, IconButton, LinearProgress } from '@mui/material';
import { NavigateNext as NavigateNextIcon, CheckCircle as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { api } from '../../utils/axiosConfig';
import CourseChat from '../../components/chat/CourseChat';

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [modules, setModules] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [modMaterials, setModMaterials] = useState<Record<number, any[]>>({});
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [courseProgress, setCourseProgress] = useState(0);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerType, setViewerType] = useState<'video' | 'doc' | 'other'>('other');
  const [activeMatTitle, setActiveMatTitle] = useState('');

  const fetchCourseData = useCallback(async () => {
    try {
      const [cRes, mRes, qRes, aRes, pRes] = await Promise.all([
         api.get(`/courses/${id}`),
         api.get(`/courses/${id}/modules`),
         api.get(`/courses/${id}/quizzes`),
         api.get(`/courses/${id}/assignments`),
         api.get('/progress')
      ]);
      
      setCourse(cRes.data);
      const mods = mRes.data || [];
      setModules(mods);
      const progress = pRes.data || [];
      setUserProgress(progress);

      // Enrich Quizzes with completion status
      const rawQuizzes = qRes.data || [];
      const enrichedQuizzes = await Promise.all(rawQuizzes.map(async (q: any) => {
         let submission = null;
         try {
            const quizSub = await api.get(`/quizzes/${q.id}/submissions/me`);
            if (quizSub.data) submission = quizSub.data;
         } catch(e) {}
         return {...q, submission};
      }));
      setQuizzes(enrichedQuizzes);
      
      const rawAssigns = aRes.data || [];
      const enrichedAssigns = await Promise.all(Boolean(rawAssigns.length) ? rawAssigns.map(async (a: any) => {
         let submission = null;
         try {
            const subRes = await api.get(`/assignments/${a.id}/submissions/me`);
            if (subRes.data && subRes.data.id) submission = subRes.data;
         } catch(e) {}
         return {...a, submission};
      }) : []);
      setAssignments(enrichedAssigns);

      // Fetch materials and calculate counts properly
      const materialResults = await Promise.all(mods.map(async (m: any) => {
        const res = await api.get(`/modules/${m.id}/materials`);
        return { moduleId: m.id, mats: res.data || [] };
      }));

      const matMap: Record<number, any[]> = {};
      let totalMats = 0;
      let completedMats = 0;

      materialResults.forEach(result => {
        matMap[result.moduleId] = result.mats;
        totalMats += result.mats.length;
        result.mats.forEach((mat: any) => {
          if (progress.some((p: any) => p.materialId === mat.id && p.isCompleted)) {
            completedMats++;
          }
        });
      });
      
      setModMaterials(matMap);

      // Calculate total progress: (Mats + Quizzes + Assignments)
      const totalItems = totalMats + enrichedQuizzes.length + enrichedAssigns.length;
      const completedItems = completedMats + 
                            enrichedQuizzes.filter((q: any) => q.submission).length + 
                            enrichedAssigns.filter((a: any) => a.submission).length;
      
      setCourseProgress(totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourseData();
  }, [id, fetchCourseData]);

  const handleDownloadMaterial = async (mat: any) => {
    if (!mat.filePath) return;
    try {
      // 1. Record Progress
      try {
        await api.post(`/progress/materials/${mat.id}`, { 
           isCompleted: true, 
           timeSpent: 120, // Example: Assume 2 mins equivalent engagement for a download
           lastPosition: 1.0 
        });
      } catch (err) { console.warn("Failed to update progress tracking"); }

      // 2. Fetch File
      const response = await api.get(`/modules/${mat.moduleId}/materials/download/${mat.filePath}`, {
        params: { orig: mat.title },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      let finalName = mat.title;
      if (!finalName.includes('.') && mat.filePath.includes('.')) {
          finalName += mat.filePath.substring(mat.filePath.lastIndexOf('.'));
      }
      
      link.setAttribute('download', finalName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) { alert("Download failed"); }
  };

  const handleViewMaterial = async (mat: any) => {
    if (!mat.filePath) return;
    try {
       // Record Progress
       api.post(`/progress/materials/${mat.id}`, { isCompleted: true, timeSpent: 30 }).catch(() => {});

       const response = await api.get(`/modules/${mat.moduleId}/materials/download/${mat.filePath}`, {
         responseType: 'blob'
       });

       const blob = new Blob([response.data], { type: response.headers['content-type'] });
       const url = URL.createObjectURL(blob);
       
       setViewerUrl(url);
       setActiveMatTitle(mat.title);
       
       const lowPath = mat.filePath.toLowerCase();
       const contentType = response.headers['content-type'] || '';

       if (lowPath.endsWith('.mp4') || lowPath.endsWith('.webm') || lowPath.endsWith('.ogg') || contentType.startsWith('video/')) {
          setViewerType('video');
       } else if (lowPath.endsWith('.pdf') || contentType === 'application/pdf' || contentType.startsWith('image/')) {
          setViewerType('doc');
       } else {
          setViewerType('other');
       }
       setViewerOpen(true);
    } catch (e) { alert("Preview unavailable"); }
  };

  const closeViewer = () => {
     if (viewerUrl) URL.revokeObjectURL(viewerUrl);
     setViewerOpen(false);
     setViewerUrl(null);
     fetchCourseData();
  };

  if (loading) return <div className="flex justify-center p-8"><CircularProgress /></div>;
  if (!course) return <Typography>Course not found.</Typography>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 py-6">
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" className="dark:text-slate-400" />} aria-label="breadcrumb" className="mb-2">
        <Link color="inherit" onClick={() => navigate('/courses')} className="cursor-pointer hover:underline dark:text-slate-400">
          Courses
        </Link>
        <Typography color="textPrimary" className="dark:text-white">{course.title}</Typography>
      </Breadcrumbs>

      <Paper className="p-6 border-none shadow-lg relative overflow-hidden dark:bg-slate-800 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white dark:from-slate-900 dark:to-slate-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500 rounded-full -translate-y-1/2 translate-x-1/3 opacity-10 z-0"></div>
        <div className="relative z-10 flex items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Chip label={course.category} size="small" className="bg-primary-500/20 text-primary-400 font-bold border border-primary-500/30" />
            </div>
            <Typography variant="h4" className="font-black text-white mb-2 leading-tight">
              {course.title}
            </Typography>
            <Typography variant="body2" className="text-gray-300 max-w-2xl line-clamp-1 mb-4 italic opacity-80">
              {course.subtitle}
            </Typography>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/5">
                <Typography variant="body2" className="text-gray-200 font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  {course.estimatedDuration} Hours Total
                </Typography>
              </div>
              <div className="flex-1 min-w-[200px] mt-2 md:mt-0">
                <div className="flex justify-between items-center mb-1">
                  <Typography variant="caption" className="font-bold text-primary-400">COURSE PROGRESS</Typography>
                  <Typography variant="caption" className="font-mono text-white">{courseProgress}%</Typography>
                </div>
                <LinearProgress 
                  variant="determinate" 
                  value={courseProgress} 
                  sx={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { backgroundColor: '#10b981' } }} 
                />
              </div>
            </div>
            <Typography variant="caption" className="text-gray-400 mb-6 block">Created by Instructor Team</Typography>
            <Button variant="contained" size="small" className="bg-primary-600 px-6 py-2 font-bold rounded-xl hover:bg-primary-700 shadow-xl shadow-primary-500/20 transition-all">
              {courseProgress > 0 ? (courseProgress === 100 ? 'Review Course' : 'Continue Learning') : 'Enroll Now'}
            </Button>
          </div>
          <div className="hidden md:block w-48 h-28 bg-gray-700 rounded-xl border border-gray-600 shadow-inner flex items-center justify-center relative overflow-hidden group cursor-pointer" onClick={() => navigate(`/IDE`)}>
            <div className="absolute inset-0 bg-primary-600/10 group-hover:bg-primary-600/30 transition-colors"></div>
            <NavigateNextIcon className="text-white scale-150 relative z-10" />
          </div>
        </div>
      </Paper>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
        <div className="space-y-6">
          <Paper className="p-4 border border-gray-100 dark:border-slate-700 shadow-sm dark:bg-slate-800">
            <Typography variant="subtitle1" className="font-bold mb-2 dark:text-white">About This Course</Typography>
            <Typography variant="body2" className="text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap line-clamp-[10]">
              {course.description}
            </Typography>
          </Paper>

          <Paper className="p-4 border border-gray-100 dark:border-slate-700 shadow-sm dark:bg-slate-800">
            <Typography variant="subtitle1" className="font-bold mb-3 dark:text-white">What You Will Learn</Typography>
            <div className="space-y-3">
              {course.learningObjectives?.split('\n').map((obj: string, i: number) => (
                <div key={i} className="flex items-start">
                  <CheckIcon className="text-green-500 mr-2 mt-0.5" sx={{ fontSize: 16 }} />
                  <Typography variant="caption" className="text-gray-700 dark:text-slate-300">{obj}</Typography>
                </div>
              ))}
            </div>
          </Paper>
        </div>
        
        <div className="space-y-6">
          <Paper className="p-4 border border-gray-100 dark:border-slate-700 shadow-sm dark:bg-slate-800 h-full">
            <Typography variant="subtitle1" className="font-bold mb-4 dark:text-white">Syllabus Curriculum</Typography>
            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 scrollbar-thin">
               {modules.length === 0 ? (
                 <Typography variant="body2" color="textSecondary" className="dark:text-slate-400">Instructor is creating syllabus modules.</Typography>
               ) : (
                 modules.map(mod => (
                    <div key={mod.id} className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-xl border border-gray-100 dark:border-slate-600 mb-2">
                      <Typography variant="caption" className="font-extrabold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-1 block">Module {mod.orderIndex}</Typography>
                      <Typography variant="subtitle2" className="font-bold dark:text-white mb-2">{mod.title}</Typography>
                      
                      <div className="space-y-1">
                         {modMaterials[mod.id]?.map((mat: any) => {
                            const isCompleted = userProgress.some((p: any) => p.materialId === mat.id && p.isCompleted);
                            return (
                              <div key={mat.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded-lg border border-gray-50 dark:border-slate-700">
                                 <Typography variant="caption" className={`font-medium ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-slate-200'}`}>
                                   {isCompleted ? '✅ ' : '📄 '} {mat.title}
                                 </Typography>
                                 <div className="flex space-x-1">
                                    <Button 
                                      size="small" 
                                      className={`text-[9px] min-w-0 px-2 py-0.5 font-bold rounded-full ${isCompleted ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'}`}
                                      onClick={() => handleViewMaterial(mat)}
                                    >
                                      {isCompleted ? 'Done' : 'View'}
                                    </Button>
                                 </div>
                              </div>
                            );
                         })}
                      </div>
                    </div>
                 ))
               )}
            </div>
          </Paper>
        </div>

        <div className="space-y-6">
          <Paper className="p-4 border border-gray-100 dark:border-slate-700 shadow-sm dark:bg-slate-800">
            <Typography variant="subtitle1" className="font-bold mb-3 dark:text-white">Evaluations Map</Typography>
            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
               {quizzes.map(q => (
                  <div key={q.id} className={`flex justify-between items-center p-2 border border-gray-100 dark:border-slate-600 rounded-lg ${q.submission ? 'bg-green-50 dark:bg-green-900/10' : 'bg-white dark:bg-slate-700/30'}`}>
                    <Typography variant="caption" className={`font-bold truncate pr-2 ${q.submission ? 'text-green-700 dark:text-green-400' : 'dark:text-slate-200'}`}>
                      {q.submission ? '✅ ' : ''}{q.title}
                    </Typography>
                    {q.submission ? (
                       <Chip label="Graded" color="success" size="small" sx={{ height: 18, fontSize: 9 }} />
                    ) : (
                       <Button size="small" variant="contained" className="text-[9px] h-6 px-3 bg-primary-600" onClick={() => navigate(`/quizzes/${q.id}/take`)}>Take</Button>
                    )}
                  </div>
               ))}
               {assignments.map(a => (
                  <div key={a.id} className={`p-2 border border-gray-100 dark:border-slate-600 rounded-lg ${a.submission ? 'bg-green-50 dark:bg-green-900/10' : 'bg-white dark:bg-slate-700/30'}`}>
                    <div className="flex justify-between items-center">
                       <Typography variant="caption" className={`font-bold truncate pr-2 ${a.submission ? 'text-green-700 dark:text-green-400' : 'dark:text-slate-200'}`}>
                         {a.submission ? '✅ ' : ''}{a.title}
                       </Typography>
                       {a.submission ? (
                          <Chip label="Submitted" color="success" size="small" sx={{ height: 18, fontSize: 9 }} />
                       ) : (
                          <Button size="small" variant="outlined" className="text-[9px] h-6 px-3 border-primary-600 text-primary-600" onClick={() => document.getElementById(`file-${a.id}`)?.click()}>Submit</Button>
                       )}
                    </div>
                    <input type="file" id={`file-${a.id}`} className="hidden" onChange={(e) => {
                                   const file = e.target.files?.[0];
                                   if (!file) return;
                                   const formData = new FormData();
                                   formData.append('file', file);
                                   api.post(`/assignments/${a.id}/submissions`, formData, {
                                     headers: { 'Content-Type': 'multipart/form-data' }
                                   }).then(() => {
                                     alert('Assignment uploaded successfully!');
                                     fetchCourseData();
                                   }).catch(err => {
                                     alert(err.response?.data?.message || 'Upload failed');
                                   });
                                 }} />
                  </div>
               ))}
            </div>
          </Paper>

          <div>
            <Typography variant="subtitle1" className="font-bold mb-3 dark:text-white">Course Discussion</Typography>
            <CourseChat courseId={Number(id)} />
          </div>
        </div>
      </div>

      {/* MATERIAL VIEWER MODAL */}
      <Dialog 
        open={viewerOpen} 
        onClose={closeViewer} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{ sx: { height: '90vh' } }}
      >
         <DialogTitle className="flex justify-between items-center py-2 bg-gray-50 border-b">
            <Typography variant="subtitle1" className="font-bold">Content Viewer: {activeMatTitle}</Typography>
            <IconButton size="small" onClick={closeViewer}><CloseIcon /></IconButton>
         </DialogTitle>
         <DialogContent className="p-0 bg-black flex items-center justify-center relative overflow-hidden">
            {viewerType === 'video' && viewerUrl && (
               <video 
                  src={viewerUrl} 
                  controls 
                  autoPlay 
                  className="w-full h-full max-h-full outline-none"
                  style={{ backgroundColor: '#000' }}
               />
            )}
            {viewerType === 'doc' && viewerUrl && (
               <iframe 
                  src={viewerUrl} 
                  title="Document Preview" 
                  className="w-full h-full border-none bg-white"
               />
            )}
            {viewerType === 'other' && (
               <div className="text-white text-center p-10">
                  <Typography variant="h6">Preview not available for this file type.</Typography>
                  <Typography variant="body2" className="mt-2 text-gray-400">Please use the 'Save' option to download and view it locally.</Typography>
                  <Button variant="contained" className="mt-6" onClick={() => {
                        const mat = modMaterials[Object.keys(modMaterials).map(Number).find(k => modMaterials[k].find(m => m.title === activeMatTitle))!].find(m => m.title === activeMatTitle);
                        handleDownloadMaterial(mat);
                        closeViewer();
                  }}>Download Now</Button>
               </div>
            )}
         </DialogContent>
      </Dialog>
    </div>
  );
}
