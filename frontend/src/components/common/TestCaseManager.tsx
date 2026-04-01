import React from 'react';
import { Box, TextField, IconButton, Button, Typography, Paper } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Terminal as TerminalIcon } from '@mui/icons-material';

interface TestCase {
  input: string;
  expected: string;
}

interface TestCaseManagerProps {
  value: string;
  onChange: (newValue: string) => void;
}

export default function TestCaseManager({ value, onChange }: TestCaseManagerProps) {
  const [testCases, setTestCases] = React.useState<TestCase[]>([]);

  React.useEffect(() => {
    try {
      const parsed = JSON.parse(value || '[]');
      if (Array.isArray(parsed)) {
        setTestCases(parsed);
      }
    } catch (e) {
      setTestCases([]);
    }
  }, [value]);

  const updateTestCases = (newCases: TestCase[]) => {
    setTestCases(newCases);
    onChange(JSON.stringify(newCases));
  };

  const handleAdd = () => {
    updateTestCases([...testCases, { input: '', expected: '' }]);
  };

  const handleRemove = (index: number) => {
    const newCases = [...testCases];
    newCases.splice(index, 1);
    updateTestCases(newCases);
  };

  const handleChange = (index: number, field: keyof TestCase, newVal: string) => {
    const newCases = [...testCases];
    newCases[index][field] = newVal;
    updateTestCases(newCases);
  };

  return (
    <Box className="space-y-4">
      <Box className="flex justify-between items-center mb-2">
        <Typography variant="subtitle2" className="font-bold flex items-center gap-2 text-indigo-900">
          <TerminalIcon fontSize="small" /> Automated Test Cases
        </Typography>
        <Button 
          size="small" 
          variant="outlined" 
          startIcon={<AddIcon />} 
          onClick={handleAdd}
          className="text-indigo-600 border-indigo-200"
        >
          Add Test Case
        </Button>
      </Box>

      {testCases.length === 0 && (
        <Paper className="p-4 bg-gray-50 border-2 border-dashed border-gray-200 text-center">
          <Typography variant="body2" color="textSecondary" className="italic">
            No test cases added yet. Click 'Add Test Case' to get started.
          </Typography>
        </Paper>
      )}

      {testCases.map((tc, index) => (
        <Paper key={index} className="p-4 border border-gray-100 bg-white relative group">
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <IconButton size="small" color="error" onClick={() => handleRemove(index)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </div>
          <Typography variant="caption" className="font-bold text-gray-400 mb-3 block">CASE #{index + 1}</Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              fullWidth
              size="small"
              label="Standard Input (stdin)"
              placeholder="e.g. 2 3"
              value={tc.input}
              onChange={(e) => handleChange(index, 'input', e.target.value)}
              variant="filled"
              className="bg-gray-50"
            />
            <TextField
              fullWidth
              size="small"
              label="Expected Output (stdout)"
              placeholder="e.g. 5"
              value={tc.expected}
              onChange={(e) => handleChange(index, 'expected', e.target.value)}
              variant="filled"
              className="bg-gray-50"
            />
          </div>
        </Paper>
      ))}
    </Box>
  );
}
