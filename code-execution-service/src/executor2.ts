import express from 'express';
import cors from 'cors';
import {execShellCommand} from './utils.js';

const app = express();
app.use(cors());
app.use(express.json());

// Interface definitions (matching types.ts)
interface TestCase {
  input: string;
  expected: string;
}

interface TestResult {
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  executionTime: number;
  error?: string;
}

interface ExecutionResponse {
  success: boolean;
  results?: TestResult[];
  allPassed?: boolean;
  error?: string;
}

// Helper function to format input for Python/JavaScript
// Converts "nums = [2,7,11,15], target = 9" to "nums = [2,7,11,15]\ntarget = 9"
const formatInput = (input: string): string => {
  // Split by comma, but be careful with commas inside brackets/quotes
  // Simple approach: split by ", " (comma followed by space) which is common in test inputs
  const parts = input.split(', ');
  // If splitting didn't work well (only one part), try splitting by comma
  if (parts.length === 1) {
    // More sophisticated: split by ", " but preserve commas inside brackets
    // For now, use a simple regex that splits on ", " followed by a word and " ="
    return input.replace(/,\s+(\w+\s*=)/g, '\n$1');
  }
  return parts.join('\n');
};

// Helper function to normalize whitespace for comparison
// Removes spaces after commas, normalizes whitespace, but preserves semantic content
const normalizeWhitespace = (str: string): string => {
  return (
    str
      .trim()
      // Remove spaces after commas
      .replace(/,\s+/g, ',')
      // Normalize multiple spaces to single space
      .replace(/\s+/g, ' ')
      // Remove spaces around brackets and parentheses
      .replace(/\s*\[\s*/g, '[')
      .replace(/\s*\]\s*/g, ']')
      .replace(/\s*\(\s*/g, '(')
      .replace(/\s*\)\s*/g, ')')
      .trim()
  );
};

// Function to get Docker command for a language
const getDockerCommand = (language: string, code: string, input: string) => {
  // Prepend input to the code for each language
  let fullCode: string;

  switch (language) {
    case 'python':
      // For Python, prepend the input directly (e.g., "nums = [2,7,11,15]\ntarget = 9\n")
      // Format the input to handle comma-separated assignments
      fullCode = formatInput(input) + '\n' + code;
      break;
    case 'cpp':
      // For C++, we'd need to parse and convert input, but for now just prepend as comments
      // This is a simplified approach - you may need more sophisticated parsing
      fullCode = `// Input: ${input}\n${code}`;
      break;
    case 'java':
      // For Java, similar to C++
      fullCode = `// Input: ${input}\n${code}`;
      break;
    case 'javascript':
      // For JavaScript, prepend the input directly
      // Format the input to handle comma-separated assignments
      fullCode = formatInput(input) + '\n' + code;
      break;
    default:
      throw new Error('Unsupported language');
  }

  const base64Code = Buffer.from(fullCode).toString('base64');
  let imageName;
  let command;

  switch (language) {
    case 'python':
      imageName = 'python:3.9';
      command = `bash -c "echo '${base64Code}' | base64 -d > program.py && python3 program.py"`;
      break;
    case 'cpp':
      imageName = 'gcc:latest';
      command = `bash -c "echo '${base64Code}' | base64 -d > program.cpp && g++ -o program program.cpp && ./program"`;
      break;
    case 'java':
      imageName = 'eclipse-temurin:17-jdk';
      command = `bash -c "echo '${base64Code}' | base64 -d > Main.java && javac Main.java && java Main"`;
      break;
    case 'javascript':
      imageName = 'node:18';
      command = `bash -c "echo '${base64Code}' | base64 -d > program.js && node program.js"`;
      break;
    default:
      throw new Error('Unsupported language');
  }

  return {imageName, command};
};

// Function to run a single test case in a Docker container
const runSingleTestCase = async (
  language: string,
  code: string,
  testCase: TestCase
): Promise<TestResult> => {
  const startTime = Date.now();
  let actual = '';
  let error: string | undefined = undefined;

  try {
    const {imageName, command} = getDockerCommand(language, code, testCase.input);

    // Run the Docker container with the command that includes the input prepended to the code
    const containerCommand = `docker run --rm --cpus=1 --pids-limit=100 ${imageName} sh -c 'timeout 10s ${command}'`;

    const output = await execShellCommand(containerCommand);
    actual = output.trim();
  } catch (err: any) {
    // Handle errors (timeout, compilation errors, runtime errors, etc.)
    error = err.message || err.toString() || 'Unknown error';
    actual = '';
  }

  const executionTime = Date.now() - startTime;
  const expected = testCase.expected.trim();
  // Normalize whitespace for comparison (handles cases like [0, 1] vs [0,1])
  const normalizedActual = normalizeWhitespace(actual);
  const normalizedExpected = normalizeWhitespace(expected);
  const passed = normalizedActual === normalizedExpected && !error;

  const result: TestResult = {
    passed,
    input: testCase.input,
    expected: testCase.expected,
    actual,
    executionTime,
  };

  if (error) {
    result.error = error;
  }

  return result;
};

// Function to run all test cases
const runTestCases = async (
  language: string,
  code: string,
  testCases: TestCase[]
): Promise<ExecutionResponse> => {
  const results: TestResult[] = [];

  for (const testCase of testCases) {
    const result = await runSingleTestCase(language, code, testCase);
    results.push(result);
  }

  const allPassed = results.every(r => r.passed);

  return {
    success: true,
    results,
    allPassed,
  };
};

// API endpoint to execute code
app.post('/execute', async (req: any, res: any) => {
  const {language, code, testCases} = req.body;

  try {
    // Validation
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Code is required',
      });
    }

    if (!language || typeof language !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Language is required',
      });
    }

    if (!Array.isArray(testCases) || testCases.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Test cases are required',
      });
    }

    // Validate each test case
    for (const testCase of testCases) {
      if (
        !testCase ||
        typeof testCase.input === 'undefined' ||
        typeof testCase.expected === 'undefined'
      ) {
        return res.status(400).json({
          success: false,
          error: 'Each test case must have input and expected fields',
        });
      }
    }

    // Execute test cases
    const result = await runTestCases(language, code, testCases);
    res.json(result);
  } catch (error: any) {
    console.error('Execution error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// Pre-pull Docker images
const prePullDockerImages = async () => {
  const images = ['python:3.9', 'gcc:latest', 'eclipse-temurin:17-jdk', 'node:18'];

  for (const image of images) {
    try {
      console.log(`Pulling image: ${image}`);
      await execShellCommand(`docker pull ${image}`);
      console.log(`Successfully pulled ${image}`);
    } catch (error) {
      console.error(`Failed to pull ${image}:`, error);
      // Continue with other images even if one fails
    }
  }

  console.log('Image pull process completed!');
};

// Start your server
const startServer = async () => {
  try {
    await prePullDockerImages();
  } catch (error) {
    console.error('Error during image pull:', error);
    // Continue starting server even if image pull fails
  }

  // Start the express app
  app.listen(8086, () => {
    console.log('Server running on port 8086');
  });
};

// Initialize the application
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
