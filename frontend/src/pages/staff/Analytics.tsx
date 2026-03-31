import { useState, useEffect } from 'react';
import { Typography, Paper, Card, CardContent, CircularProgress, Button } from '@mui/material';
import { api } from '../../utils/axiosConfig';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<any[]>([]);
  const [allAssignments, setAllAssignments] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [courseRes, studentRes, subRes, quizRes, assignRes] = await Promise.all([
           api.get('/courses'),
           api.get('/users/all'),
           api.get('/reports/submissions').catch(() => ({ data: [] })),
           api.get('/reports/quizzes').catch(() => ({ data: [] })),
           api.get('/reports/assignments').catch(() => ({ data: [] }))
        ]);
        setCourses(courseRes.data.content || []);
        setStudents((studentRes.data || []).filter((u: any) => u.role === 'STUDENT'));
        setSubmissions(subRes.data || []);
        setAllQuizzes(quizRes.data || []);
        setAllAssignments(assignRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="flex justify-center p-12"><CircularProgress /></div>;

  const totalCourses = courses.length;
  const totalStudents = students.length;
  const publishedCourses = courses.filter(c => c.status === 'PUBLISHED').length;
  const totalDuration = courses.reduce((sum, c) => sum + (c.estimatedDuration || 0), 0);
  const totalXp = students.reduce((sum, s) => sum + (s.totalXp || 0), 0);

  // Categories distribution
  const categories: Record<string, number> = {};
  courses.forEach(c => {
    categories[c.category] = (categories[c.category] || 0) + 1;
  });

  const processStudentMetrics = () => {
     return students.map(student => {
        const studentSubs = submissions.filter(sub => sub.userId === student.id);
        const assignments = studentSubs.filter(sub => sub.assignmentId);
        const quizzes = studentSubs.filter(sub => sub.quizId);

        const assignmentCount = assignments.length;
        const assignmentAvg = assignments.length > 0 
           ? (assignments.reduce((sum, a) => sum + (a.score || 0), 0) / assignmentCount).toFixed(1) 
           : 'N/A';

        const quizCount = quizzes.length;
        const quizAvg = quizzes.length > 0 
           ? (quizzes.reduce((sum, q) => sum + (q.score || 0), 0) / quizCount).toFixed(1) + '%'
           : 'N/A';

        return {
           name: student.fullName,
           email: student.email,
           xp: student.totalXp,
           assignmentCompletions: assignmentCount,
           assignmentAvgGrade: assignmentAvg,
           quizCompletions: quizCount,
           quizAvgGrade: quizAvg
        };
     });
  };

  const processDetailedReport = () => {
    return submissions.map(sub => {
       const student = students.find(s => s.id === sub.userId);
       let itemName = "Unknown";
       let courseTitle = "Platform Utility";
       
       if (sub.quizId) {
          const quiz = allQuizzes.find(q => q.id === sub.quizId);
          itemName = quiz?.title || `Quiz #${sub.quizId}`;
          // Quizzes/Assignments often have a course object or courseId serialized.
          // Finding the course in our global List.
          const cId = (quiz as any)?.course?.id || (quiz as any)?.courseId;
          courseTitle = courses.find(c => c.id === cId)?.title || "General";
       } else if (sub.assignmentId) {
          const assign = allAssignments.find(a => a.id === sub.assignmentId);
          itemName = assign?.title || `Assignment #${sub.assignmentId}`;
          const cId = (assign as any)?.course?.id || (assign as any)?.courseId;
          courseTitle = courses.find(c => c.id === cId)?.title || "General";
       }
       
       return {
          courseName: courseTitle,
          itemName: itemName,
          studentName: student?.fullName || "Deleted User",
          submissionDate: sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "Real-time Error",
          status: sub.status || "PENDING",
          points: sub.score || 0
       };
    });
  };

  const downloadAdminReport = (format: 'pdf' | 'xlsx' | 'detailed-pdf' | 'detailed-xlsx') => {
     const isDetailed = format.startsWith('detailed');
     const reportData = isDetailed ? processDetailedReport() : processStudentMetrics();
     const filename = isDetailed 
        ? `detailed-submission-report-${new Date().toISOString().split('T')[0]}`
        : `student-completion-report-${new Date().toISOString().split('T')[0]}`;

     if (format.includes('pdf')) {
        const doc = new jsPDF('landscape');
        doc.text(isDetailed ? "EduNova Detailed Submission Log (Real-time Audit)" : "EduNova Completion Report", 14, 15);
        
        if (isDetailed) {
           autoTable(doc, {
              startY: 20,
              head: [['Course Name', 'Assignment / Quiz Name', 'Student Name', 'Submission Date & Time', 'Status', 'Points / Score']],
              body: reportData.map((d: any) => [d.courseName, d.itemName, d.studentName, d.submissionDate, d.status, d.points]),
           });
        } else {
           autoTable(doc, {
              startY: 20,
              head: [['Student Name', 'Email', 'Assignments Completed', 'Avg Assignment Grade', 'Quizzes Completed', 'Avg Quiz Score', 'Total XP']],
              body: reportData.map((d: any) => [d.name, d.email, d.assignmentCompletions, d.assignmentAvgGrade, d.quizCompletions, d.quizAvgGrade, d.xp]),
           });
        }
        doc.save(`${filename}.pdf`);
     } else {
        const sheetData = isDetailed ? reportData.map((d: any) => ({
           "Course Name": d.courseName,
           "Assignment / Quiz Name": d.itemName,
           "Student Name": d.studentName,
           "Submission Date & Time": d.submissionDate,
           "Status": d.status,
           "Points / Score": d.points
        })) : reportData.map((d: any) => ({
           "Student Name": d.name,
           "Email": d.email,
           "Total Learner XP": d.xp,
           "Assignments Completed": d.assignmentCompletions,
           "Avg Assignment Grade": d.assignmentAvgGrade,
           "Quizzes Completed": d.quizCompletions,
           "Avg Quiz Score": d.quizAvgGrade
        }));

        const ws = XLSX.utils.json_to_sheet(sheetData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Records");
        XLSX.writeFile(wb, `${filename}.xlsx`);
     }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col md:flex-row justify-between md:items-center">
        <div>
           <Typography variant="h4" className="font-bold text-gray-900">Platform Analytics</Typography>
           <Typography color="textSecondary">Real-time metrics and performance across EduNova.</Typography>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
           <Button 
             variant="outlined" 
             className="border-primary-600 text-primary-600 font-semibold"
             onClick={() => downloadAdminReport('pdf')}
           >
             Summary PDF
           </Button>
           <Button 
             variant="outlined" 
             className="border-secondary-600 text-secondary-600 font-semibold"
             onClick={() => downloadAdminReport('xlsx')}
           >
             Summary XLSX
           </Button>
           <div className="border-l border-gray-300 mx-2 h-10 hidden md:block"></div>
           <Button 
             variant="contained" 
             className="bg-primary-600 font-semibold shadow-sm"
             onClick={() => downloadAdminReport('detailed-pdf')}
           >
             Detailed Submissions (PDF)
           </Button>
           <Button 
             variant="contained" 
             style={{ backgroundColor: '#2e7d32' }}
             className="font-semibold shadow-sm text-white"
             onClick={() => downloadAdminReport('detailed-xlsx')}
           >
             Detailed Submissions (XLSX)
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-primary-500 shadow-sm">
          <CardContent>
            <Typography color="textSecondary" variant="subtitle2">Total Students</Typography>
            <Typography variant="h3" className="font-bold text-gray-800">{totalStudents}</Typography>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-green-500 shadow-sm">
          <CardContent>
            <Typography color="textSecondary" variant="subtitle2">Published Courses</Typography>
            <Typography variant="h3" className="font-bold text-gray-800">{publishedCourses} / {totalCourses}</Typography>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-orange-500 shadow-sm">
          <CardContent>
            <Typography color="textSecondary" variant="subtitle2">Total Dev Hrs</Typography>
            <Typography variant="h3" className="font-bold text-gray-800">{totalDuration}h</Typography>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-purple-500 shadow-sm">
          <CardContent>
            <Typography color="textSecondary" variant="subtitle2">Total Student XP</Typography>
            <Typography variant="h3" className="font-bold text-gray-800">{totalXp}</Typography>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Paper className="p-6 shadow-sm border border-gray-100 h-full">
          <Typography variant="h6" className="font-bold mb-4 border-b pb-2">Course Categories Distribution</Typography>
          <div className="space-y-4 mt-4">
            {Object.entries(categories).map(([cat, count]) => (
              <div key={cat} className="flex justify-between items-center space-x-4">
                <Typography variant="body1" className="w-1/3 truncate">{cat}</Typography>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${(count / (totalCourses || 1)) * 100}%` }}></div>
                </div>
                <Typography variant="body2" className="font-bold text-gray-600 w-8 text-right">{count}</Typography>
              </div>
            ))}
            {Object.keys(categories).length === 0 && <Typography color="textSecondary">No categories active right now.</Typography>}
          </div>
        </Paper>

        <Paper className="p-6 shadow-sm border border-gray-100 bg-gray-50 flex items-center justify-center min-h-[250px]">
          <div className="text-center">
             <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
             </div>
            <Typography variant="h6" className="font-bold text-gray-800 mb-2">Growth Charts</Typography>
            <Typography variant="body2" color="textSecondary">Integrate D3.js, Chart.js, or Recharts to upgrade this panel in future updates. Native stats currently mapping via REST constraints.</Typography>
          </div>
        </Paper>
      </div>
    </div>
  );
}
