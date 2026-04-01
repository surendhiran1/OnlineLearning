package com.edunova.service;

import lombok.Data;
import org.springframework.stereotype.Service;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

@Service
public class CodeExecutionService {

    private static final String BITS_STDC_H_CONTENT = 
        "#include <iostream>\n" +
        "#include <vector>\n" +
        "#include <string>\n" +
        "#include <algorithm>\n" +
        "#include <map>\n" +
        "#include <set>\n" +
        "#include <unordered_map>\n" +
        "#include <unordered_set>\n" +
        "#include <queue>\n" +
        "#include <stack>\n" +
        "#include <cmath>\n" +
        "#include <cstdio>\n" +
        "#include <cstdlib>\n" +
        "#include <cstring>\n" +
        "#include <cassert>\n" +
        "#include <numeric>\n" +
        "#include <bitset>\n" +
        "#include <functional>\n" +
        "#include <deque>\n" +
        "#include <list>\n" +
        "#include <utility>\n" +
        "#include <iomanip>\n" +
        "#include <tuple>\n" +
        "#include <complex>\n";

    public ExecutionResult execute(String language, String code, String input) {
        ExecutionResult res = new ExecutionResult();
        try {
            Path tempDir = Files.createTempDirectory("edunova_exec_");
            String fileName;
            String compileCmd = null;
            String runCmd;
            
            switch (language.toLowerCase()) {
                case "cpp":
                    fileName = "main.cpp";
                    Files.writeString(tempDir.resolve(fileName), code);
                    Path bitsDir = tempDir.resolve("bits");
                    Files.createDirectories(bitsDir);
                    Files.writeString(bitsDir.resolve("stdc++.h"), BITS_STDC_H_CONTENT);
                    compileCmd = "g++ -I. " + fileName + " -o main.out";
                    runCmd = "./main.out";
                    break;
                case "c":
                    fileName = "main.c";
                    Files.writeString(tempDir.resolve(fileName), code);
                    compileCmd = "gcc " + fileName + " -o main.out";
                    runCmd = "./main.out";
                    break;
                case "java":
                    fileName = "Main.java";
                    Files.writeString(tempDir.resolve(fileName), code);
                    compileCmd = "javac " + fileName;
                    runCmd = "java Main";
                    break;
                case "python":
                    fileName = "script.py";
                    Files.writeString(tempDir.resolve(fileName), code);
                    runCmd = "python3 " + fileName;
                    break;
                case "javascript":
                    fileName = "script.js";
                    Files.writeString(tempDir.resolve(fileName), code);
                    runCmd = "node " + fileName;
                    break;
                default:
                    res.setError("Unsupported language: " + language);
                    return res;
            }

            if (compileCmd != null) {
                Process compileProcess = Runtime.getRuntime().exec(compileCmd, null, tempDir.toFile());
                if (!compileProcess.waitFor(10, TimeUnit.SECONDS)) {
                    res.setError("Compilation timeout reached (10s)");
                    deleteDir(tempDir.toFile());
                    return res;
                }
                if (compileProcess.exitValue() != 0) {
                    res.setError(readStream(compileProcess.getErrorStream()));
                    deleteDir(tempDir.toFile());
                    return res;
                }
            }

            Process runProcess = Runtime.getRuntime().exec(runCmd, null, tempDir.toFile());
            
            if (input != null && !input.isEmpty()) {
                BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(runProcess.getOutputStream()));
                writer.write(input);
                writer.flush();
                writer.close();
            }

            StringBuilder output = new StringBuilder();
            StringBuilder error = new StringBuilder();
            
            Thread outThread = new Thread(() -> output.append(readStream(runProcess.getInputStream())));
            Thread errThread = new Thread(() -> error.append(readStream(runProcess.getErrorStream())));
            
            outThread.start();
            errThread.start();

            if (!runProcess.waitFor(5, TimeUnit.SECONDS)) {
                runProcess.destroyForcibly();
                res.setError("Execution timeout reached (5s)");
            } else {
                outThread.join(1000);
                errThread.join(1000);
                res.setOutput(output.toString().trim());
                if (error.length() > 0) res.setError(error.toString().trim());
            }

            deleteDir(tempDir.toFile());
            
        } catch (Exception e) {
            res.setError("Execution Error: " + e.getMessage());
        }
        return res;
    }

    private String readStream(InputStream is) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\n");
            }
            return sb.toString();
        } catch (IOException e) {
            return "Error reading stream: " + e.getMessage();
        }
    }

    private void deleteDir(File file) {
        File[] contents = file.listFiles();
        if (contents != null) {
            for (File f : contents) deleteDir(f);
        }
        file.delete();
    }

    @Data
    public static class ExecutionResult {
        private String output;
        private String error;
    }
}
