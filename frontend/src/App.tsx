import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import CourseList from './pages/student/CourseList';
import CourseDetails from './pages/student/CourseDetails';
import QuizTake from './pages/student/QuizTake';
import QuizResults from './pages/student/QuizResults';
import StudentProgress from './pages/student/StudentProgress';
import Assignments from './pages/student/Assignments';
import ManageCourses from './pages/staff/ManageCourses';
import ManageCourseDetails from './pages/staff/ManageCourseDetails';
import ManageQuizQuestions from './pages/staff/ManageQuizQuestions';
import Students from './pages/staff/Students';
import Analytics from './pages/staff/Analytics';
import ManageSubmissions from './pages/staff/ManageSubmissions';
import Settings from './pages/dashboard/Settings';
import Layout from './components/layout/Layout';
import IDE from './pages/student/IDE';
import GroupChat from './pages/student/GroupChat';
import AssignmentIDE from './pages/student/AssignmentIDE';
import CodingChallenges from './pages/student/CodingChallenges';
import ThemeProvider from './components/common/ThemeProvider';
import { ProtectedRoute, PublicRoute } from './components/common/ProtectedRoute';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/courses" element={<CourseList />} />
                <Route path="/courses/:id" element={<CourseDetails />} />
                <Route path="/courses/manage" element={<ManageCourses />} />
                <Route path="/courses/manage/:id" element={<ManageCourseDetails />} />
                <Route path="/courses/manage/quizzes/:quizId" element={<ManageQuizQuestions />} />
                
                <Route path="/quizzes/:id/take" element={<QuizTake />} />
                <Route path="/quizzes/:id/results" element={<QuizResults />} />
                
                <Route path="/progress" element={<StudentProgress />} />
                <Route path="/assignments" element={<Assignments />} />
                <Route path="/instructor/assignments/:assignmentId/submissions" element={<ManageSubmissions />} />
                <Route path="/students" element={<Students />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/ide" element={<IDE />} />
                <Route path="/messages" element={<GroupChat />} />
                <Route path="/student/assignments/:assignmentId/ide" element={<AssignmentIDE />} />
                <Route path="/coding-challenges" element={<CodingChallenges />} />
              </Route>
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
