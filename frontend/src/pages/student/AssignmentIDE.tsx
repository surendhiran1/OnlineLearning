import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { api } from '../../utils/axiosConfig';
import { 
  Typography, 
  Button, 
  Select, 
  MenuItem, 
  FormControl,
  CircularProgress,
  Chip,
} from '@mui/material';
import { 
  Send as SendIcon,
  ArrowBack as BackIcon,
  Info as InfoIcon,
  History as HistoryIcon,
  KeyboardArrowDown as DownIcon,
  KeyboardArrowRight as RightIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Code as CodeIcon,
  CleaningServices as CleanIcon
} from '@mui/icons-material';

const LANGUAGES = [
  { id: 'cpp', name: 'C++', default: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cout << "Enter a number: ";\n    if (!(cin >> n)) return 0;\n    cout << "You entered: " << n << endl;\n    return 0;\n}' },
  { id: 'java', name: 'Java', default: 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.println("Hello From Java!");\n    }\n}' },
  { id: 'python', name: 'Python', default: 'name = input("Enter your name: ")\nprint(f"Hello {name} from Python!")' },
  { id: 'javascript', name: 'JavaScript', default: 'console.log("Hello EduNova!");' },
  { id: 'c', name: 'C', default: '#include <stdio.h>\n\nint main() {\n    printf("Hello EduNova!\\n");\n    return 0;\n}' }
];

export default function AssignmentIDE() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  
  
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [userInput, setUserInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  
  const editorRef = useRef<any>(null);


  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        // We might need to fetch the course first or have a direct endpoint for assignment details
        // Assuming there's a generic GET /assignments/:id if provided, but typically it's course-nested.
        // Let's try searching for it or assume it exists based on common patterns.
        const res = await api.get(`/assignments/${assignmentId}`); // NOTE: Verify backend endpoint
        setAssignment(res.data);
        setLanguage(res.data.language || 'javascript');
        
        // GFG Feature: Use instructor's boilerplate if provided, else fall back to generic
        if (res.data.codeBoilerplate) {
           setCode(res.data.codeBoilerplate);
        } else {
           const langDefault = LANGUAGES.find(l => l.id === (res.data.language || 'javascript'))?.default || '';
           setCode(langDefault);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignment();
  }, [assignmentId]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleLanguageChange = (id: string) => {
    setLanguage(id);
    const lang = LANGUAGES.find(l => l.id === id);
    if (lang) setCode(lang.default);
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput('');
    setError('');
    setTestResults(null);
    
    try {
       const res = await api.post('/execute', {
          language,
          code,
          input: userInput
       });
       
       if (res.data.error) {
          setError(res.data.error);
       }
       if (res.data.output) {
          setOutput(res.data.output);
       }
       
       const time = res.data.executionTime ? `\n\n[Process completed in ${res.data.executionTime}s]` : '';
       setOutput(prev => prev + time);
    } catch (err: any) {
       setError("System Error: Could not connect to execution gateway.");
    } finally {
       setIsRunning(false);
    }
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults(null);
    setOutput('Running automated test cases...\n');
    
    try {
        if (!assignment) {
            setError('Assignment data not loaded.');
            setIsRunning(false);
            return;
        }
        let cases: any[] = [];
        try { cases = JSON.parse(assignment.testCases || '[]'); } catch(e) {}
        
        if (cases.length === 0) {
            setOutput(prev => prev + 'No test cases defined for this assignment.');
            setIsRunning(false);
            return;
        }

        let passed = 0;
        const results = [];

        for (const [index, tc] of cases.entries()) {
            const res = await api.post('/execute', { 
                language, 
                code, 
                input: tc.input || "" 
            });
            
            const out = (res.data.output || "").trim();
            const exp = (tc.expected || "").trim();
            const isMatch = !res.data.error && out === exp;
            
            if (isMatch) passed++;
            results.push({
                index,
                input: tc.input,
                expected: tc.expected,
                actual: out,
                passed: isMatch,
                error: res.data.error
            });
        }
        
        setTestResults({ passed, total: cases.length, results });
        setOutput(prev => prev + `\nCompleted: ${passed}/${cases.length} tests passed.`);
    } catch (err) {
        setError('Failed to execute test cases.');
    } finally {
        setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!assignment) {
        alert('Cannot submit: Assignment data not found.');
        return;
    }
    if (!testResults && assignment.testCases) {
        if (!window.confirm("You haven't run all tests yet. Submission will take current results. Submit anyway?")) return;
    }

    setIsSubmitting(true);
    try {
        const score = testResults ? Math.round((testResults.passed / testResults.total) * 100) : 0;
        await api.post(`/assignments/${assignmentId}/submissions`, {
            code,
            language,
            score
        });
        alert(`Assignment submitted! Final score based on tests: ${score}%`);
        navigate('/assignments');
    } catch (err) {
        alert('Submission failed. Please try again.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const [activeTab, setActiveTab] = useState('problem'); // problem, submissions
  const [consoleExpanded, setConsoleExpanded] = useState(true);

  if (loading) return <div className="flex justify-center p-20"><CircularProgress /></div>;

  return (
    <div className="h-screen bg-gray-50 dark:bg-slate-900 flex flex-col overflow-hidden">
      {/* HEADER: GFG Style */}
      <header className="h-14 bg-[#232F3E] text-white flex items-center justify-between px-6 shadow-md z-50">
        <div className="flex items-center space-x-6">
           <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate(-1)}>
              <BackIcon className="group-hover:-translate-x-1 transition-transform" />
              <Typography variant="h6" className="font-extrabold tracking-tight text-white/90">EduNova Arena</Typography>
           </div>
           <div className="h-6 w-px bg-white/20"></div>
           <Typography variant="body2" className="font-medium text-white/70 line-clamp-1 max-w-[300px]">
             {assignment?.title}
           </Typography>
        </div>

        <div className="flex items-center space-x-4">
           <div className="flex bg-black/30 rounded-lg p-0.5">
             <Button 
                size="small" 
                className={`text-[10px] font-bold px-3 py-1 rounded-md transition-all ${activeTab === 'problem' ? 'bg-white text-gray-900' : 'text-gray-400'}`}
                onClick={() => setActiveTab('problem')}
             >
                PROBLEM
             </Button>
             <Button 
                size="small"
                className={`text-[10px] font-bold px-3 py-1 rounded-md transition-all ${activeTab === 'submissions' ? 'bg-white text-gray-900' : 'text-gray-400'}`}
                onClick={() => setActiveTab('submissions')}
             >
                SUBMISSIONS
             </Button>
           </div>
           
           <FormControl size="small" className="w-[120px]">
              <Select 
                value={language} 
                onChange={(e) => handleLanguageChange(e.target.value)}
                sx={{ color: 'white', backgroundColor: 'rgba(255,255,255,0.1)', height: 32, fontSize: 12, '& .MuiSvgIcon-root': { color: 'white' } }}
              >
                {LANGUAGES.map(lang => (
                  <MenuItem key={lang.id} value={lang.id} className="text-xs">{lang.name}</MenuItem>
                ))}
              </Select>
           </FormControl>

           <Button 
              variant="contained" 
              className="bg-[#2f8d46] hover:bg-[#216d33] text-white font-black text-xs h-8 px-4 rounded"
              startIcon={isSubmitting ? <CircularProgress size={14} color="inherit" /> : <SendIcon sx={{ fontSize: 14 }} />}
              onClick={handleSubmit}
              disabled={isSubmitting || isRunning}
           >
              SUBMIT
           </Button>
        </div>
      </header>

      {/* MAIN CONTENT: SPLIT VIEW */}
      <main className="flex-1 flex overflow-hidden">
         {/* LEFT: Problem Description */}
         <section className="w-[40%] h-full overflow-y-auto border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col p-6 space-y-6">
            <div>
               <Typography variant="h5" className="font-extrabold text-[#232F3E] dark:text-white mb-2">{assignment?.title}</Typography>
               <div className="flex items-center gap-2 mb-6">
                 <Chip label="Medium" size="small" className="bg-orange-50 text-orange-600 font-bold border border-orange-100" />
                 <Chip label="Accuracy: 56.4%" size="small" variant="outlined" className="text-gray-400 border-gray-200 font-bold" />
                 <Typography variant="caption" className="text-gray-400 font-bold uppercase ml-auto">Points: {assignment?.points}</Typography>
               </div>
            </div>

            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-slate-300">
               <Typography variant="body2" className="mb-4 whitespace-pre-wrap leading-relaxed">
                  {assignment?.description}
               </Typography>
            </div>

            {assignment?.testCases && (
               <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
                  <Typography variant="subtitle2" className="font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <InfoIcon fontSize="small" /> Sample Input/Output
                  </Typography>
                  {(() => {
                    try {
                      if (!assignment?.testCases) return null;
                      const cases = JSON.parse(assignment.testCases).slice(0, 2);
                      return cases.map((tc: any, i: number) => (
                        <div key={i} className="mb-4 space-y-2">
                           <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                              <Typography variant="caption" className="block font-bold text-gray-500 mb-1">Input:</Typography>
                              <code className="text-sm dark:text-white">{tc.input || "(no input)"}</code>
                           </div>
                           <div className="bg-[#f8fff9] dark:bg-slate-800 p-3 rounded-lg border border-[#e8f5e9] dark:border-slate-700">
                              <Typography variant="caption" className="block font-bold text-[#2e7d32] mb-1">Expected Output:</Typography>
                              <code className="text-sm dark:text-[#81c784]">{tc.expected}</code>
                           </div>
                        </div>
                      ));
                    } catch(e) { return null; }
                  })()}
               </div>
            )}
            
            <div className="pt-6 border-t border-gray-100 dark:border-slate-800 text-gray-400 italic">
               <Typography variant="caption">Time Limit: 1.0 Sec | Memory: 512 MB</Typography>
            </div>
         </section>

         {/* RIGHT: Editor & Console */}
         <section className="flex-1 h-full flex flex-col bg-[#1E1E1E] relative">
            <div className={`flex-1 flex flex-col overflow-hidden ${consoleExpanded ? 'h-[60%]' : 'h-full'}`}>
               <div className="h-10 bg-[#333333] flex items-center px-4 justify-between border-b border-[#252525]">
                  <Typography variant="caption" className="text-gray-300 font-bold uppercase tracking-widest flex items-center gap-2">
                    <CodeIcon sx={{ fontSize: 14 }} /> Solution IDE
                  </Typography>
                  <div className="flex gap-2">
                    <Button 
                      size="small" 
                      className="text-gray-400 hover:text-white text-[10px]"
                      onClick={() => setCode(LANGUAGES.find(l => l.id === language)?.default || '')}
                    >
                      RESET
                    </Button>
                  </div>
               </div>
               
               <Editor
                  height="100%"
                  language={language}
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  onMount={handleEditorDidMount}
                  options={{
                      fontSize: 14,
                      minimap: { enabled: false },
                      automaticLayout: true,
                      padding: { top: 20 },
                      fontFamily: "'Fira Code', 'Monaco', monospace",
                      scrollBeyondLastLine: false,
                      lineNumbers: 'on',
                      scrollbar: { vertical: 'hidden' }
                  }}
               />
            </div>

            {/* ACTION BAR AT BOTTOM OF EDITOR */}
            <div className="h-12 bg-[#252526] border-y border-[#3e3e42] flex items-center justify-between px-4 z-10">
               <Button 
                 size="small" 
                 className="text-gray-300 hover:text-white text-[10px] font-bold"
                 onClick={() => setConsoleExpanded(!consoleExpanded)}
                 startIcon={consoleExpanded ? <DownIcon /> : <RightIcon />}
               >
                 CONSOLE & RESULTS
               </Button>
               
               <div className="flex gap-3">
                  <Button 
                    variant="contained" 
                    size="small"
                    className="bg-[#2a2a2a] hover:bg-[#333333] text-white text-[10px] font-bold border border-white/10 px-4 h-8"
                    onClick={runCode}
                    disabled={isRunning}
                  >
                    RUN CODE
                  </Button>
                  <Button 
                    variant="contained" 
                    size="small"
                    className="bg-[#3e3e42] hover:bg-[#4a4a4f] text-white text-[10px] font-bold border border-indigo-400/50 px-4 h-8"
                    onClick={runTests}
                    disabled={isRunning || !assignment?.testCases}
                  >
                    RUN ALL TESTS
                  </Button>
               </div>
            </div>

            {/* CONSOLE AREA */}
            <div className={`transition-all duration-300 bg-[#1e1e1e] border-t border-[#3e3e42] overflow-hidden ${consoleExpanded ? 'h-[40%] flex flex-col' : 'h-0'}`}>
               <div className="flex-1 grid grid-cols-2 overflow-hidden">
                  {/* INPUT / OUTPUT */}
                  <div className="border-r border-[#3e3e42] flex flex-col overflow-hidden">
                     <div className="bg-[#252526] px-3 py-1 flex items-center text-gray-500 border-b border-[#3e3e42]">
                        <Typography variant="caption" className="text-[9px] font-bold uppercase tracking-tighter">Custom Input</Typography>
                     </div>
                     <textarea 
                        className="flex-1 bg-transparent p-3 text-white font-mono text-xs outline-none resize-none"
                        placeholder="Enter your test input here..."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                     />
                     
                     <div className="h-[50%] bg-[#0e0e0e] border-t border-[#3e3e42] flex flex-col">
                        <div className="bg-[#252526] px-3 py-1 flex items-center justify-between text-gray-500">
                           <Typography variant="caption" className="text-[9px] font-bold uppercase tracking-tighter">Stdout Output</Typography>
                           <CleanIcon sx={{ fontSize: 12, cursor: 'pointer' }} onClick={() => setOutput('')} />
                        </div>
                        <div className="flex-1 p-3 font-mono text-xs overflow-y-auto whitespace-pre-wrap">
                           {error ? <span className="text-red-400">{error}</span> : <span className="text-[#a6e22e]">{output}</span>}
                           {isRunning && <div className="text-gray-500 flex items-center gap-2 mt-1"><CircularProgress size={10} color="inherit" /> Executing...</div>}
                        </div>
                     </div>
                  </div>

                  {/* TEST RESULTS */}
                  <div className="flex flex-col overflow-hidden bg-[#0a0a0a]">
                     <div className="bg-[#252526] px-4 py-2 flex items-center justify-between border-b border-[#3e3e42]">
                        <Typography variant="caption" className="text-[10px] font-black tracking-widest text-[#2f8d46]">VALIDATION RESULTS</Typography>
                        {testResults && (
                           <Chip 
                             label={`${testResults.passed}/${testResults.total} PASSED`} 
                             size="small" 
                             className={`h-5 text-[9px] font-black ${testResults.passed === testResults.total ? 'bg-[#2f8d46] text-white' : 'bg-orange-600 text-white'}`} 
                           />
                        )}
                     </div>
                     
                     <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {!testResults ? (
                           <div className="h-full flex flex-col items-center justify-center opacity-30">
                              <HistoryIcon sx={{ fontSize: 40, color: 'white' }} />
                              <Typography variant="caption" className="text-white mt-2">No tests executed yet.</Typography>
                           </div>
                        ) : (
                           testResults.results.map((r: any) => (
                              <div key={r.index} className={`p-3 rounded-lg border flex items-center justify-between transition-all group hover:scale-[1.01] ${r.passed ? 'bg-[#152e1a] border-[#2f8d46]/30 text-emerald-400/80 shadow-sm shadow-[#2f8d46]/10' : 'bg-[#2e1d1d] border-red-900/30 text-red-400/80'}`}>
                                 <div className="flex items-center gap-3">
                                    <div className={`p-1 rounded-full ${r.passed ? 'bg-[#2f8d46]/20' : 'bg-red-400/10'}`}>
                                       {r.passed ? <CheckIcon sx={{ fontSize: 12 }} /> : <ErrorIcon sx={{ fontSize: 12 }} />}
                                    </div>
                                    <div>
                                       <Typography className="text-[11px] font-black uppercase tracking-tight">Test Case #{r.index + 1}</Typography>
                                       {r.error && <Typography className="text-[9px] opacity-60 font-mono line-clamp-1">{r.error}</Typography>}
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <Typography className={`text-[10px] font-black uppercase ${r.passed ? 'text-[#2f8d46]' : 'text-red-400'}`}>
                                       {r.passed ? 'PASS' : 'FAIL'}
                                    </Typography>
                                 </div>
                              </div>
                           ))
                        )}
                     </div>
                  </div>
               </div>
            </div>
         </section>
      </main>
    </div>
  );
};
