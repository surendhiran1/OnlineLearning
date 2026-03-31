import { useLocation, useNavigate } from 'react-router-dom';
import { Paper, Typography, Button, Box } from '@mui/material';
import { CheckCircle as SuccessIcon, ErrorOutline as FailIcon } from '@mui/icons-material';

export default function QuizResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  if (!result) {
    return (
      <div className="text-center p-12">
        <Typography>No results found. Please take the quiz first.</Typography>
        <Button onClick={() => navigate('/courses')} className="mt-4">Back to Courses</Button>
      </div>
    );
  }

  const passed = result.grade >= 70;

  return (
    <div className="max-w-2xl mx-auto py-12">
      <Paper className="p-10 border border-gray-100 shadow-md text-center rounded-2xl relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-2 ${passed ? 'bg-green-500' : 'bg-red-500'}`}></div>
        
        <Box className="flex justify-center mb-6">
          {passed ? (
            <SuccessIcon className="text-green-500" sx={{ fontSize: 80 }} />
          ) : (
            <FailIcon className="text-red-500" sx={{ fontSize: 80 }} />
          )}
        </Box>

        <Typography variant="h3" className="font-extrabold text-gray-900 mb-2">
          {result.score}%
        </Typography>
        
        <Typography variant="h6" className={`font-semibold mb-8 ${passed ? 'text-green-600' : 'text-red-600'}`}>
          {passed ? 'Congratulations! You passed.' : 'You did not pass. Try again.'}
        </Typography>

        <div className="grid grid-cols-2 gap-4 text-left bg-gray-50 p-6 rounded-xl mb-8">
          <div>
            <Typography variant="body2" color="textSecondary">Submitted At</Typography>
            <Typography variant="body1" className="font-medium text-gray-900">
              {new Date(result.submittedAt).toLocaleString()}
            </Typography>
          </div>
          <div>
            <Typography variant="body2" color="textSecondary">Attempt</Typography>
            <Typography variant="body1" className="font-medium text-gray-900">
              #{result.attempts}
            </Typography>
          </div>
          <div>
            <Typography variant="body2" color="textSecondary">Time Spent</Typography>
            <Typography variant="body1" className="font-medium text-gray-900">
              {Math.floor(result.timeSpent / 60)}m {result.timeSpent % 60}s
            </Typography>
          </div>
          <div>
            <Typography variant="body2" color="textSecondary">Graded Score</Typography>
            <Typography variant="body1" className="font-medium text-gray-900">
              {result.grade} / 100
            </Typography>
          </div>
        </div>

        <Button 
          variant="contained" 
          size="large"
          fullWidth
          className="bg-primary-600 hover:bg-primary-700 py-3 rounded-xl font-bold"
          onClick={() => navigate('/dashboard')}
        >
          Return to Dashboard
        </Button>
      </Paper>
    </div>
  );
}
