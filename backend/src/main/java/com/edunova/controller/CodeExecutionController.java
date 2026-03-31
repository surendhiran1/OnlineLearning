package com.edunova.controller;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/v1/execute")
@RequiredArgsConstructor
public class CodeExecutionController {

    @PostMapping
    @PreAuthorize("hasRole('STUDENT') or hasRole('STAFF')")
    public ResponseEntity<ExecutionResponse> executeCode(@RequestBody ExecutionRequest req) {
        ExecutionResponse res = new ExecutionResponse();
        long startTime = System.currentTimeMillis();
        
        try {
            Path tempDir = Files.createTempDirectory("edunova_exec_");
            String fileName;
            String compileCmd = null;
            String runCmd;
            
            switch (req.language.toLowerCase()) {
                case "cpp":
                    fileName = "main.cpp";
                    Files.writeString(tempDir.resolve(fileName), req.code);
                    compileCmd = "g++ " + fileName + " -o main.out";
                    runCmd = "./main.out";
                    break;
                case "c":
                    fileName = "main.c";
                    Files.writeString(tempDir.resolve(fileName), req.code);
                    compileCmd = "gcc " + fileName + " -o main.out";
                    runCmd = "./main.out";
                    break;
                case "java":
                    fileName = "Main.java";
                    Files.writeString(tempDir.resolve(fileName), req.code);
                    compileCmd = "javac " + fileName;
                    runCmd = "java Main";
                    break;
                case "python":
                    fileName = "script.py";
                    Files.writeString(tempDir.resolve(fileName), req.code);
                    runCmd = "python3 " + fileName;
                    break;
                case "javascript":
                    fileName = "script.js";
                    Files.writeString(tempDir.resolve(fileName), req.code);
                    runCmd = "node " + fileName;
                    break;
                default:
                    res.setError("Unsupported language: " + req.language);
                    return ResponseEntity.badRequest().body(res);
            }

            // Compilation stage
            if (compileCmd != null) {
                Process compileProcess = Runtime.getRuntime().exec(compileCmd, null, tempDir.toFile());
                if (!compileProcess.waitFor(10, TimeUnit.SECONDS)) {
                    res.setError("Compilation timeout reached (10s)");
                    deleteDir(tempDir.toFile());
                    return ResponseEntity.ok(res);
                }
                if (compileProcess.exitValue() != 0) {
                    res.setError(readStream(compileProcess.getErrorStream()));
                    deleteDir(tempDir.toFile());
                    return ResponseEntity.ok(res);
                }
            }

            // Execution stage
            Process runProcess = Runtime.getRuntime().exec(runCmd, null, tempDir.toFile());
            
            // Provide stdin
            if (req.input != null && !req.input.isEmpty()) {
                BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(runProcess.getOutputStream()));
                writer.write(req.input);
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
                res.setOutput(output.toString());
                if (error.length() > 0) res.setError(error.toString());
            }

            deleteDir(tempDir.toFile());
            
        } catch (Exception e) {
            res.setError("Internal Error: " + e.getMessage());
        } finally {
            res.setExecutionTime((System.currentTimeMillis() - startTime) / 1000.0);
        }
        
        return ResponseEntity.ok(res);
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
    public static class ExecutionRequest {
        private String language;
        private String code;
        private String input;
    }

    @Data
    public static class ExecutionResponse {
        private String output;
        private String error;
        private Double executionTime;
    }
}
