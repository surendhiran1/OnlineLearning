import { useState, useEffect } from 'react';
import { Card, CardContent, CardMedia, Typography, Button, Chip, CircularProgress } from '@mui/material';
import { AccessTime as TimeIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/axiosConfig';

interface Course {
  id: number;
  title: string;
  subtitle: string;
  thumbnailUrl: string;
  category: string;
  estimatedDuration: number;
  instructorId: number;
}

export default function CourseList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        setCourses(res.data.content || []);
      } catch (err) {
        console.error('Failed to load courses', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><CircularProgress /></div>;
  }

  return (
    <div>
      <div className="mb-8">
        <Typography variant="h4" className="font-bold text-gray-900">Course Catalog</Typography>
        <Typography color="textSecondary">Discover and enroll in top-rated courses.</Typography>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
          <Typography color="textSecondary">No courses available at the moment.</Typography>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <Card key={course.id} className="h-full flex flex-col hover:shadow-lg transition-shadow">
              <CardMedia
                component="img"
                height="140"
                image={course.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'}
                alt={course.title}
                className="h-48 object-cover"
              />
              <CardContent className="flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <Chip label={course.category} size="small" color="primary" variant="outlined" />
                  <div className="flex items-center text-gray-500 text-sm">
                    <TimeIcon fontSize="small" className="mr-1" />
                    {course.estimatedDuration}h
                  </div>
                </div>
                <Typography variant="h6" component="h2" className="font-bold mb-1 leading-tight">
                  {course.title}
                </Typography>
                <Typography variant="body2" color="textSecondary" className="mb-4 flex-1">
                  {course.subtitle}
                </Typography>
                <Button 
                  variant="contained" 
                  fullWidth 
                  className="bg-primary-600 hover:bg-primary-700 mt-auto"
                  onClick={() => navigate(`/courses/${course.id}`)}
                >
                  View Course
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
