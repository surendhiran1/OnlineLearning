import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Paper, RadioGroup, FormControlLabel, Radio, LinearProgress, CircularProgress, TextField, Checkbox, FormGroup, Grid, Box } from '@mui/material';
import { api } from '../../utils/axiosConfig';
import Editor from '@monaco-editor/react';

export default function QuizTake() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<Date>(new Date());

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await api.get(`/quizzes/${id}/questions`);
        setQuestions(res.data || []);
        setStartTime(new Date());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [id]);

  if (loading) return <div className="flex justify-center p-12"><CircularProgress /></div>;
  if (questions.length === 0) return <Typography className="p-8 text-center text-gray-500">No questions found for this quiz.</Typography>;

  const currentQuestion = questions[currentIdx];
  const progress = ((currentIdx) / questions.length) * 100;

  const handleOptionSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: e.target.value
    });
  };

  const handleMultipleSelect = (opt: string) => {
    const current = (answers[currentQuestion.id] || []) as string[];
    const updated = current.includes(opt) 
      ? current.filter(x => x !== opt) 
      : [...current, opt];
    
    setAnswers({
      ...answers,
      [currentQuestion.id]: updated
    });
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
    
    const answerList = Object.keys(answers).map(qId => {
      const ans = answers[Number(qId)];
      return {
        questionId: Number(qId),
        answer: typeof ans === 'object' ? JSON.stringify(ans) : String(ans)
      };
    });

    try {
      const res = await api.post(`/quizzes/${id}/submissions`, {
        answers: answerList,
        startedAt: startTime,
        timeSpent: timeSpent
      });
      navigate(`/quizzes/${id}/results`, { state: { result: res.data } });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit quiz');
      setSubmitting(false);
    }
  };

  let options = [];
  try {
    options = JSON.parse(currentQuestion.options || '[]');
  } catch(e) {}

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h5" className="font-bold text-gray-900">Quiz Assessment</Typography>
        <Typography color="textSecondary">Question {currentIdx + 1} of {questions.length}</Typography>
      </div>

      <LinearProgress variant="determinate" value={progress} className="h-2 rounded mb-8" />

      <Paper className="p-8 border border-gray-100 shadow-sm min-h-[400px] flex flex-col">
        <div className="mb-6 flex-1">
          <Typography variant="subtitle1" className="text-primary-600 font-semibold mb-2 uppercase tracking-wide text-sm">
            {currentQuestion.type?.replace('_', ' ')}
          </Typography>
          <Typography variant="h5" className="font-medium text-gray-900 mb-8 leading-relaxed">
            {currentQuestion.text}
          </Typography>

          {currentQuestion.type === 'CODE' && (
             <div className="h-64 mt-4 border rounded overflow-hidden border-gray-700">
                <Editor
                  height="100%"
                  defaultLanguage="javascript"
                  theme="vs-dark"
                  value={answers[currentQuestion.id] || '// Write your algorithmic solution here...'}
                  onChange={(value: string | undefined) => setAnswers({ ...answers, [currentQuestion.id]: value || '' })}
                  options={{ minimap: { enabled: false }, fontSize: 14 }}
                />
             </div>
          )}

          {currentQuestion.type === 'FILL_BLANKS' && (
             <TextField fullWidth multiline rows={2} variant="outlined" placeholder="Type your explicit answer here..." value={answers[currentQuestion.id] || ''} onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })} />
          )}

          {(currentQuestion.type === 'MCQ_SINGLE' || currentQuestion.type === 'TRUE_FALSE') && (
            <RadioGroup 
              value={answers[currentQuestion.id] || ''} 
              onChange={handleOptionSelect}
              className="space-y-4"
            >
              {(options.length > 0 ? options : (currentQuestion.type === 'TRUE_FALSE' ? ['True', 'False'] : [])).map((opt: string, i: number) => (
                <FormControlLabel 
                  key={i} 
                  value={opt} 
                  control={<Radio color="primary" />} 
                  label={<span className="text-lg text-gray-700">{opt}</span>} 
                  className={`border rounded-xl p-2 pl-4 transition-colors ${answers[currentQuestion.id] === opt ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}`}
                />
              ))}
            </RadioGroup>
          )}

          {currentQuestion.type === 'MCQ_MULTIPLE' && (
            <FormGroup className="space-y-4">
              {options.map((opt: string, i: number) => {
                const isSelected = (answers[currentQuestion.id] || []).includes(opt);
                return (
                  <FormControlLabel 
                    key={i} 
                    control={<Checkbox checked={isSelected} onChange={() => handleMultipleSelect(opt)} color="primary" />} 
                    label={<span className="text-lg text-gray-700">{opt}</span>} 
                    className={`border rounded-xl p-2 pl-4 transition-colors ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}`}
                  />
                );
              })}
            </FormGroup>
          )}

          {currentQuestion.type === 'MATCHING' && (
            <Grid container spacing={3}>
              {options.map((opt: any, i: number) => (
                <Grid size={12} key={i}>
                  <Box className="flex items-center space-x-4 mb-4 ml-0">
                    <Paper className="p-4 bg-gray-50 border border-gray-200 w-1/2">{opt.key || opt}</Paper>
                    <TextField 
                      placeholder="Match value..." 
                      size="small"
                      className="flex-1"
                      onChange={(e) => {
                        const current = answers[currentQuestion.id] || {};
                        setAnswers({...answers, [currentQuestion.id]: {...current, [opt.key || opt]: e.target.value}});
                      }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-gray-100 mt-auto">
          <Button 
            disabled={currentIdx === 0 || submitting} 
            onClick={() => setCurrentIdx(currentIdx - 1)}
            className="text-gray-500"
          >
            Previous
          </Button>
          
          <Button 
            variant="contained" 
            className="bg-primary-600 hover:bg-primary-700 px-8"
            onClick={handleNext}
            disabled={
              submitting || 
              (currentQuestion.type === 'MCQ_MULTIPLE' ? (answers[currentQuestion.id] || []).length === 0 : !answers[currentQuestion.id])
            }
          >
            {submitting ? 'Submitting...' : (currentIdx === questions.length - 1 ? 'Finish & Submit' : 'Next Question')}
          </Button>
        </div>
      </Paper>
    </div>
  );
}
