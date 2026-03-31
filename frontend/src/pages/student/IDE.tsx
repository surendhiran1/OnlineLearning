import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { api } from '../../utils/axiosConfig';
import { 
  Paper, 
  Typography, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Box,
  CircularProgress,
  Divider,
  Tooltip
} from '@mui/material';
import { 
  PlayArrow as PlayIcon, 
  Code as CodeIcon,
  Terminal as TerminalIcon,
  CleaningServices as CleanIcon
} from '@mui/icons-material';

const LANGUAGES = [
  { id: 'cpp', name: 'C++', default: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cout << "Enter a number: ";\n    if (!(cin >> n)) return 0;\n    cout << "You entered: " << n << endl;\n    return 0;\n}' },
  { id: 'java', name: 'Java', default: 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.println("Hello From Java!");\n    }\n}' },
  { id: 'python', name: 'Python', default: 'name = input("Enter your name: ")\nprint(f"Hello {name} from Python!")' },
  { id: 'javascript', name: 'JavaScript', default: 'console.log("Hello EduNova!");' },
  { id: 'c', name: 'C', default: '#include <stdio.h>\n\nint main() {\n    printf("Hello EduNova!\\n");\n    return 0;\n}' }
];

export default function IDE() {
  const { darkMode } = useSelector((state: RootState) => state.theme);
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState(LANGUAGES[0].default);
  const [userInput, setUserInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [theme, setTheme] = useState(darkMode ? 'vs-dark' : 'light');
  const editorRef = useRef<any>(null);

  useEffect(() => {
     setTheme(darkMode ? 'vs-dark' : 'light');
  }, [darkMode]);

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

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
      {/* HEADER CONTROLS */}
      <Paper className="p-4 border border-gray-100 dark:border-slate-700 shadow-sm flex justify-between items-center bg-gray-50/50 dark:bg-slate-800">
        <Box className="flex items-center space-x-6">
           <div className="flex items-center space-x-2">
              <CodeIcon color="primary" />
              <Typography variant="h6" className="font-bold text-gray-800 dark:text-white">Cloud Compiler</Typography>
           </div>
           
           <FormControl size="small" className="min-w-[150px]">
              <InputLabel id="language-label">Language</InputLabel>
              <Select 
                labelId="language-label"
                value={language} 
                onChange={(e) => handleLanguageChange(e.target.value)}
                label="Language"
              >
                {LANGUAGES.map(lang => (
                  <MenuItem key={lang.id} value={lang.id}>{lang.name}</MenuItem>
                ))}
              </Select>
           </FormControl>

           <FormControl size="small" className="min-w-[120px]">
              <InputLabel id="theme-label">Theme</InputLabel>
              <Select 
                labelId="theme-label"
                value={theme} 
                onChange={(e) => setTheme(e.target.value)}
                label="Theme"
              >
                <MenuItem value="vs-dark">Dark Mode</MenuItem>
                <MenuItem value="light">Light Mode</MenuItem>
              </Select>
           </FormControl>
        </Box>

        <Box className="flex space-x-3">
           <Tooltip title="Clear Console">
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => setOutput('')}
                className="border-gray-300 text-gray-600"
              >
                <CleanIcon fontSize="small" />
              </Button>
           </Tooltip>
           <Button 
              variant="contained" 
              className={`bg-primary-600 px-6 font-bold flex items-center space-x-2 ${isRunning ? 'opacity-70' : ''}`}
              onClick={runCode}
              disabled={isRunning}
           >
              {isRunning ? <CircularProgress size={20} color="inherit" /> : <PlayIcon />}
              <span>{isRunning ? 'Running...' : 'Run Code'}</span>
           </Button>
        </Box>
      </Paper>

      {/* EDITOR & OUTPUT SPLIT */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
         <Paper className="md:col-span-2 overflow-hidden border border-gray-200 shadow-lg rounded-lg flex flex-col">
            <div className="flex-1 min-h-[300px]">
               <Editor
                 height="100%"
                 language={language}
                 theme={theme}
                 value={code}
                 onChange={(value) => setCode(value || '')}
                 onMount={handleEditorDidMount}
                 options={{
                   fontSize: 14,
                   minimap: { enabled: true },
                   scrollBeyondLastLine: false,
                   automaticLayout: true,
                   padding: { top: 16 }
                 }}
               />
            </div>
            
            {/* INPUT PANEL */}
            <div className="h-32 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-0 flex flex-col">
               <div className="bg-gray-200 dark:bg-slate-700 px-3 py-1 flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                  <TerminalIcon sx={{ fontSize: 14 }} />
                  <Typography variant="caption" className="font-bold uppercase">Standard Input (stdin)</Typography>
               </div>
               <textarea 
                  className="flex-1 p-3 font-mono text-sm bg-transparent outline-none resize-none placeholder-gray-400 dark:text-white"
                  placeholder="Enter your program inputs here (one per line)..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
               />
            </div>
         </Paper>

         <Paper className="bg-gray-900 border border-gray-800 shadow-lg flex flex-col rounded-lg overflow-hidden">
            <div className="p-3 bg-gray-800 flex items-center justify-between">
               <div className="flex items-center space-x-2 text-gray-300">
                  <TerminalIcon fontSize="small" />
                  <Typography variant="caption" className="font-bold uppercase tracking-widest">Output Terminal</Typography>
               </div>
               {isRunning && <CircularProgress size={16} color="inherit" className="mr-2" />}
            </div>
            <Divider className="bg-gray-700" />
            <div className="flex-1 p-4 font-mono text-sm overflow-y-auto whitespace-pre-wrap">
               {error ? (
                  <span className="text-red-400">{error}</span>
               ) : (
                  <span className="text-emerald-400">{output || '>_ System ready. Waiting for execution...'}</span>
               )}
            </div>
         </Paper>
      </div>
    </div>
  );
}
