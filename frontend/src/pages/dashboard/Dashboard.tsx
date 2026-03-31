import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import StudentDashboard from './StudentDashboard';
import StaffDashboard from './StaffDashboard';

export default function Dashboard() {
  const { role } = useSelector((state: RootState) => state.auth);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Overview</h1>
        <p className="text-gray-500">Here's what's happening with your account today.</p>
      </div>
      
      {role === 'STAFF' ? <StaffDashboard /> : <StudentDashboard />}
    </>
  );
}
