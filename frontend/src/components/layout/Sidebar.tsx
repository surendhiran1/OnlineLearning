import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { 
  Dashboard as DashboardIcon, 
  LibraryBooks as CoursesIcon, 
  Assignment as AssignmentIcon,
  Timeline as ProgressIcon,
  People as UsersIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Code as CodeIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import { IconButton } from '@mui/material';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { role } = useSelector((state: RootState) => state.auth);

  const studentLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { name: 'My Courses', path: '/courses', icon: <CoursesIcon /> },
    { name: 'Assignments', path: '/assignments', icon: <AssignmentIcon /> },
    { name: 'Progress', path: '/progress', icon: <ProgressIcon /> },
    { name: 'Coding Playground', path: '/ide', icon: <CodeIcon /> },
    { name: 'Discussions', path: '/messages', icon: <ChatIcon /> },
  ];

  const staffLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { name: 'Manage Courses', path: '/courses/manage', icon: <CoursesIcon /> },
    { name: 'Students', path: '/students', icon: <UsersIcon /> },
    { name: 'Analytics', path: '/analytics', icon: <ProgressIcon /> },
    { name: 'Coding IDE', path: '/ide', icon: <CodeIcon /> },
    { name: 'Discussions', path: '/messages', icon: <ChatIcon /> },
  ];

  const links = role === 'STAFF' ? staffLinks : studentLinks;

  return (
    <>
      <div 
        className={`fixed inset-0 bg-gray-900/50 z-30 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />
      
      <aside className={`fixed md:sticky top-0 left-0 z-40 w-64 h-screen bg-gray-900 text-white transition-transform transform ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} flex flex-col`}>
        <div className="h-16 flex items-center border-b border-gray-800 px-6 justify-between">
          <span className="text-2xl font-bold text-primary-500">EduNova</span>
          <div className="md:hidden text-gray-400">
            <IconButton color="inherit" onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg transition-colors group ${
                  isActive 
                    ? 'bg-primary-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span className="mr-3">{link.icon}</span>
              <span className="font-medium text-sm">{link.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-lg transition-colors group ${
                isActive 
                  ? 'bg-primary-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span className="mr-3"><SettingsIcon /></span>
            <span className="font-medium text-sm">Settings</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}
