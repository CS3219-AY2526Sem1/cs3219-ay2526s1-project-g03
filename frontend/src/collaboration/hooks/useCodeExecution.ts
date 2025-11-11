import {useState} from 'react';
import axios from 'axios';
import type {TestCase, TestResult, ExecutionResult} from '../components/CodeExecutionPanel';

const EXECUTION_SERVICE_URL = 'http://localhost:8086';

interface ExecutionRequest {
  code: string;
  language: string;
  testCases: TestCase[];
}

interface ExecutionResponse {
  success: boolean;
  results?: TestResult[];
  allPassed?: boolean;
  error?: string;
}

/**
 * Parse testcase string format "Input: ...\nOutput: ..." into TestCase object
 */
function parseTestCase(testCase: string): TestCase {
  if (!testCase) {
    return {input: '', expected: ''};
  }
  const inputMatch = testCase.match(/Input:\s*(.+?)(?=\nOutput:)/s);
  const outputMatch = testCase.match(/Output:\s*(.+?)(?=\n|$)/s);

  return {
    input: inputMatch ? inputMatch[1].trim() : '',
    expected: outputMatch ? outputMatch[1].trim() : '',
  };
}

/**
 * Transform testcase strings to TestCase[] format
 */
function transformTestCases(testcases: string[]): TestCase[] {
  return testcases.map(parseTestCase);
}

/**
 * Map editor language to execution service language
 */
function mapLanguage(editorLanguage: string): string | null {
  const languageMap: Record<string, string> = {
    python: 'python',
    javascript: 'javascript',
    java: 'java',
    cpp: 'cpp',
  };

  return languageMap[editorLanguage] || null;
}

/**
 * Hook for executing code with test cases
 */
export function useCodeExecution() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const executeCode = async (
    code: string,
    language: string,
    testcases: string[]
  ): Promise<ExecutionResult | null> => {
    // Validate language support
    const mappedLanguage = mapLanguage(language);
    if (!mappedLanguage) {
      const error = `Language "${language}" is not supported yet. Currently supported: python, javascript`;
      setExecutionError(error);
      setExecutionResult({
        success: false,
        error,
      });
      return null;
    }

    // Validate inputs
    if (!code || code.trim().length === 0) {
      const error = 'Code cannot be empty';
      setExecutionError(error);
      setExecutionResult({
        success: false,
        error,
      });
      return null;
    }

    if (!testcases || testcases.length === 0) {
      const error = 'No test cases provided';
      setExecutionError(error);
      setExecutionResult({
        success: false,
        error,
      });
      return null;
    }

    // Transform testcases
    const testCases = transformTestCases(testcases);

    // Prepare request
    const request: ExecutionRequest = {
      code,
      language: mappedLanguage,
      testCases,
    };

    try {
      setIsExecuting(true);
      setExecutionError(null);
      setExecutionResult(null);

      const response = await axios.post<ExecutionResponse>(
        `${EXECUTION_SERVICE_URL}/execute`,
        request,
        {
          timeout: 30000, // 30 second timeout
        }
      );

      const result: ExecutionResult = {
        success: response.data.success,
        results: response.data.results,
        allPassed: response.data.allPassed,
        error: response.data.error,
      };

      setExecutionResult(result);
      return result;
    } catch (error) {
      let errorMessage = 'Failed to execute code';
      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage = error.response.data?.error || error.response.statusText || errorMessage;
        } else if (error.request) {
          errorMessage = 'Unable to connect to execution service. Please ensure it is running.';
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      const result: ExecutionResult = {
        success: false,
        error: errorMessage,
      };

      setExecutionError(errorMessage);
      setExecutionResult(result);
      return result;
    } finally {
      setIsExecuting(false);
    }
  };

  const clearResults = () => {
    setExecutionResult(null);
    setExecutionError(null);
  };

  return {
    executeCode,
    isExecuting,
    executionResult,
    executionError,
    clearResults,
  };
}
