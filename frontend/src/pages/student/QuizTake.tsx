import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Button, 
  Paper, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  LinearProgress, 
  CircularProgress, 
  TextField, 
  Checkbox, 
  FormGroup, 
  Divider,
  Chip
} from '@mui/material';
import { api } from '../../utils/axiosConfig';
import Editor from '@monaco-editor/react';
import { 
  Timer as TimerIcon, 
  Code as CodeIcon, 
  PlayArrow as PlayIcon,
  ChevronLeft,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

export default function QuizTake() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<Date>(new Date());
  
  const [runningCode, setRunningCode] = useState(false);
  const [codeResult, setCodeResult] = useState<any>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await api.get(`/quizzes/${id}/questions`);
        const qList = res.data;
        if (Array.isArray(qList)) {
            setQuestions(qList);
            
            // Populate boilerplate for CODE questions
            const initialAnswers: Record<number, any> = {};
            qList.forEach((q: any) => {
                if (q.type === 'CODE' && q.codeBoilerplate) {
                    initialAnswers[q.id] = q.codeBoilerplate;
                }
            });
            setAnswers(initialAnswers);
        } else {
            setQuestions([]);
        }
        setStartTime(new Date());
      } catch (err) {
        console.error("Quiz fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <CircularProgress />
      <Typography className="animate-pulse text-gray-400">Loading Assessment Environment...</Typography>
    </div>
  );
  
  const hasQuestions = Array.isArray(questions) && questions.length > 0;
  
  if (!hasQuestions) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-xl rounded-3xl max-w-lg mx-auto mt-20">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
           <CodeIcon color="error" sx={{ fontSize: 40 }} />
        </div>
        <Typography variant="h5" className="text-gray-900 dark:text-white mb-4 font-black">No Content Found</Typography>
        <Typography variant="body2" color="textSecondary" className="mb-8 dark:text-slate-400">
          We couldn't find any questions for this challenge. Please contact your instructor.
        </Typography>
        <Button variant="contained" className="bg-indigo-600 px-8 py-3 rounded-xl font-bold" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx] || {};
  const progress = (questions.length > 0) ? ((currentIdx + 1) / questions.length) * 100 : 0;

  useEffect(() => {
      setCodeResult(null);
  }, [currentIdx]);

  const handleOptionSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswers({ ...answers, [currentQuestion.id]: e.target.value });
  };

  const handleMultipleSelect = (opt: string) => {
    const current = (answers[currentQuestion.id] || []) as string[];
    const updated = current.includes(opt) 
      ? current.filter(x => x !== opt) 
      : [...current, opt];
    setAnswers({ ...answers, [currentQuestion.id]: updated });
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
    
    const answerList = Object.keys(answers).map(qId => ({
      questionId: Number(qId),
      answer: typeof answers[Number(qId)] === 'object' ? JSON.stringify(answers[Number(qId)]) : String(answers[Number(qId)])
    }));

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
    if (currentQuestion.options) {
      const parsed = JSON.parse(currentQuestion.options);
      options = Array.isArray(parsed) ? parsed : [];
    }
  } catch(e) {}

  const handleRunCode = async () => {
    setRunningCode(true);
    try {
       const codeStr = answers[currentQuestion.id] || '';
       let cases: any[] = [];
       try { cases = JSON.parse(currentQuestion.testCases || '[]'); } catch(e) {}

       if (cases.length === 0) {
           const res = await api.post('/execute', { language: 'javascript', code: codeStr, input: '' });
           setCodeResult({ type: 'single', output: res.data.output, error: res.data.error, time: res.data.executionTime });
       } else {
           let passedCount = 0;
           const details = [];
           for (const tc of cases) {
               const res = await api.post('/execute', { language: 'javascript', code: codeStr, input: tc.input || "" });
               const out = (res.data.output || "").trim();
               const exp = (tc.expected || "").trim();
               const ok = !res.data.error && out === exp;
               if (ok) passedCount++;
               details.push({ input: tc.input, expected: tc.expected, actual: out, passed: ok });
           }
           setCodeResult({ type: 'tests', passed: passedCount, total: cases.length, details });
       }
    } catch(err) {
       setCodeResult({ type: 'error', error: 'System Error: Code execution failed' });
    }
    setRunningCode(false);
  };

  const isCodingQuestion = currentQuestion.type === 'CODE';

  return (
    <div className={`mx-auto ${isCodingQuestion ? 'max-w-none px-0 -mt-6 -mx-6 h-[calc(100vh-64px)]' : 'max-w-3xl py-8'}`}>
      {!isCodingQuestion && (
        <div className="flex justify-between items-center mb-6 px-4">
          <div>
             <Typography variant="h5" className="font-black text-gray-900 dark:text-white">Assessment Phase</Typography>
             <Typography variant="caption" className="text-gray-400 font-bold uppercase tracking-widest">{currentIdx + 1} of {questions.length} Questions</Typography>
          </div>
          <Chip icon={<TimerIcon fontSize="small" />} label="Time Active" className="font-bold bg-indigo-50 text-indigo-700" />
        </div>
      )}

      {/* PROGRESS TOP LINE */}
      {!isCodingQuestion && <LinearProgress variant="determinate" value={progress} className="h-1.5 rounded mb-8 mx-4" />}

      {isCodingQuestion ? (
         /* FULL IDE LAYOUT INSTEAD OF STANDARD BOX */
         <div className="flex h-full overflow-hidden bg-white dark:bg-slate-900 shadow-2xl">
            {/* LEFT: Instructions */}
            <div className="w-[400px] border-r border-gray-100 dark:border-slate-800 flex flex-col p-6 overflow-y-auto bg-gray-50/30 dark:bg-slate-900/50">
                <div className="flex items-center gap-2 mb-6">
                    <Chip label="Algorithm" size="small" className="bg-indigo-600 text-white font-black text-[10px]" />
                    <Chip label={`Points: ${currentQuestion.points}`} size="small" variant="outlined" className="font-bold text-[10px]" />
                </div>
                <Typography variant="h5" className="font-black mb-4 dark:text-white">Problem Description</Typography>
                <Divider className="mb-6 opacity-50" />
                <Typography className="text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {currentQuestion.text}
                </Typography>

                <div className="mt-12 pt-8 border-t border-gray-200 dark:border-slate-800 flex justify-between items-center mt-auto">
                    <Button 
                       startIcon={<ChevronLeft />} 
                       disabled={currentIdx === 0} 
                       onClick={() => setCurrentIdx(currentIdx - 1)}
                       className="font-bold text-gray-400"
                    >
                       Previous
                    </Button>
                    <Button 
                       variant="contained" 
                       className="bg-indigo-600 font-bold rounded-lg px-6"
                       onClick={handleNext}
                    >
                       {currentIdx === questions.length - 1 ? 'Finish Challenge' : 'Next Question'}
                    </Button>
                </div>
            </div>

            {/* RIGHT: IDE & Console */}
            <div className="flex-1 flex flex-col bg-[#1E1E1E]">
                <div className="h-10 bg-[#252526] border-b border-black flex items-center px-4 justify-between">
                    <Typography className="text-[10px] font-black text-gray-400 tracking-widest uppercase flex items-center gap-2">
                        <CodeIcon sx={{ fontSize: 14 }} /> Solution IDE - Javascript
                    </Typography>
                    <Button 
                       size="small" 
                       variant="contained" 
                       className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] h-6"
                       startIcon={runningCode ? <CircularProgress size={10} color="inherit" /> : <PlayIcon sx={{ fontSize: 14 }} />}
                       onClick={handleRunCode}
                       disabled={runningCode}
                    >
                       RUN TESTS
                    </Button>
                </div>
                <div className="flex-1">
                   <Editor
                      height="100%"
                      defaultLanguage="javascript"
                      theme="vs-dark"
                      value={answers[currentQuestion.id] || '// Write your solution here...'}
                      onChange={(val) => setAnswers({ ...answers, [currentQuestion.id]: val || '' })}
                      options={{ 
                        minimap: { enabled: false }, 
                        fontSize: 14, 
                        fontFamily: "Fira Code, monospace",
                        padding: { top: 10 }
                      }}
                   />
                </div>
                
                {/* CONSOLE AREA */}
                <div className="h-[30%] bg-black border-t border-gray-800 flex flex-col p-4 overflow-y-auto">
                    <Typography className="text-[10px] font-black text-gray-500 mb-2 tracking-widest uppercase">Console Output</Typography>
                    {!codeResult ? (
                        <Typography className="text-gray-600 italic text-xs">Run your code to see the magic happen...</Typography>
                    ) : (
                        <div className="space-y-3">
                           {codeResult.type === 'tests' && (
                               <>
                                 <Typography className={`font-black text-sm ${codeResult.passed === codeResult.total ? 'text-emerald-400' : 'text-orange-400'}`}>
                                    {codeResult.passed === codeResult.total ? <CheckIcon className="mb-px mr-1" fontSize="small" /> : null}
                                    {codeResult.passed}/{codeResult.total} Test Cases Passed
                                 </Typography>
                                 <div className="space-y-2">
                                     {codeResult.details.map((d: any, i: number) => (
                                         <div key={i} className={`text-[10px] p-2 border-l-2 ${d.passed ? 'border-emerald-500 bg-emerald-500/5' : 'border-red-500 bg-red-500/5'}`}>
                                             <div className="flex justify-between items-center">
                                                 <span className="font-bold text-gray-400">TEST #{i+1}</span>
                                                 <span className={d.passed ? 'text-emerald-500' : 'text-red-500'}>{d.passed ? 'PASS' : 'FAIL'}</span>
                                             </div>
                                             {!d.passed && <div className="text-red-400/70 mt-1">Expected: {d.expected} | Actual: {d.actual}</div>}
                                         </div>
                                     ))}
                                 </div>
                               </>
                           )}
                           {codeResult.type === 'single' && (
                               <div className="font-mono text-xs text-emerald-400 bg-emerald-900/10 p-3 rounded border border-emerald-900/30">
                                   {codeResult.error ? <span className="text-red-400">Error: {codeResult.error}</span> : <code>{codeResult.output}</code>}
                                   {codeResult.time && <div className="text-[10px] mt-2 text-gray-500">Execution time: {codeResult.time}s</div>}
                               </div>
                           )}
                        </div>
                    )}
                </div>
            </div>
         </div>
      ) : (
         /* STANDARD QUIZ LAYOUT FOR MCQ/ETC */
         <Paper className="p-10 border border-gray-100 dark:border-slate-800 dark:bg-slate-800 shadow-xl min-h-[500px] flex flex-col rounded-3xl overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 to-primary-400`}></div>
            
            <div className="mb-10 flex-1">
              <Typography variant="subtitle1" className="text-primary-600 font-bold mb-4 uppercase tracking-[0.2em] text-[10px]">
                {currentQuestion.type?.replace('_', ' ')}
              </Typography>
              <Typography variant="h4" className="font-black text-gray-900 dark:text-white mb-10 leading-tight">
                {currentQuestion.text}
              </Typography>

              {currentQuestion.type === 'FILL_BLANKS' && (
                 <TextField 
                    fullWidth 
                    multiline 
                    rows={2} 
                    variant="filled" 
                    placeholder="Enter your response..." 
                    className="bg-gray-50 dark:bg-slate-900/50 rounded-xl overflow-hidden" 
                    value={answers[currentQuestion.id] || ''} 
                    onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })} 
                 />
              )}

              {(currentQuestion.type === 'MCQ_SINGLE' || currentQuestion.type === 'TRUE_FALSE') && (
                <RadioGroup value={answers[currentQuestion.id] || ''} onChange={handleOptionSelect} className="space-y-4">
                  {(options.length > 0 ? options : (currentQuestion.type === 'TRUE_FALSE' ? ['True', 'False'] : [])).map((opt: string, i: number) => (
                    <FormControlLabel 
                      key={i} 
                      value={opt} 
                      control={<Radio color="primary" />} 
                      label={<span className="text-lg font-bold text-gray-700 dark:text-slate-300">{opt}</span>} 
                      className={`border rounded-2xl p-4 transition-all duration-200 ${answers[currentQuestion.id] === opt ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md scale-[1.02]' : 'border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}
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
                        label={<span className="text-lg font-bold text-gray-700 dark:text-slate-300">{opt}</span>} 
                        className={`border rounded-2xl p-4 transition-all duration-200 ${isSelected ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md scale-[1.02]' : 'border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}
                      />
                    );
                  })}
                </FormGroup>
              )}
            </div>

            <div className="flex justify-between items-center pt-8 border-t border-gray-100 dark:border-slate-700 mt-auto">
              <Button 
                disabled={currentIdx === 0 || submitting} 
                onClick={() => setCurrentIdx(currentIdx - 1)}
                className="text-gray-400 font-bold"
              >
                Previous
              </Button>
              
              <Button 
                variant="contained" 
                className="bg-indigo-600 hover:bg-indigo-700 px-10 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none"
                onClick={handleNext}
                disabled={submitting || (currentQuestion.type === 'MCQ_MULTIPLE' ? (answers[currentQuestion.id] || []).length === 0 : !answers[currentQuestion.id])}
              >
                {submitting ? 'Submitting...' : (currentIdx === questions.length - 1 ? 'Submit Assessment' : 'Next Question')}
              </Button>
            </div>
         </Paper>
      )}
    </div>
  );
}
