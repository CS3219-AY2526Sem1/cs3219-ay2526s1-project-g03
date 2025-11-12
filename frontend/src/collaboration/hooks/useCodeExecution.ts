import {useState, useEffect, useRef} from 'react';
import axios from 'axios';
import * as Y from 'yjs';
import type YPartyKitProvider from 'y-partykit/provider';
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
 * Syncs execution state and results across all users via YPartyKit
 */
export function useCodeExecution(provider: YPartyKitProvider | null) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const executionMapRef = useRef<Y.Map<any> | null>(null);

  // Sync execution state with shared Y.Map
  useEffect(() => {
    if (!provider) {
      executionMapRef.current = null;
      return;
    }

    // Get or create the shared Y.Map for execution state
    const executionMap = provider.doc.getMap('execution');
    executionMapRef.current = executionMap;

    // Observer function to sync changes from shared state to local state
    const observer = () => {
      const sharedIsExecuting = executionMap.get('isExecuting') ?? false;
      const sharedResult = executionMap.get('executionResult');
      const sharedError = executionMap.get('executionError');

      setIsExecuting(sharedIsExecuting as boolean);
      setExecutionResult(sharedResult as ExecutionResult | null);
      setExecutionError(sharedError as string | null);
    };

    // Set up observer and load initial state
    executionMap.observe(observer);
    observer(); // Load initial state

    // Cleanup
    return () => {
      executionMap.unobserve(observer);
      executionMapRef.current = null;
    };
  }, [provider]);

  // Helper function to update shared state
  const updateSharedState = (
    isExecutingValue: boolean,
    result: ExecutionResult | null,
    error: string | null
  ) => {
    const executionMap = executionMapRef.current;
    if (!executionMap) return;

    executionMap.set('isExecuting', isExecutingValue);
    executionMap.set('executionResult', result);
    executionMap.set('executionError', error);
  };

  const executeCode = async (
    code: string,
    language: string,
    testcases: string[]
  ): Promise<ExecutionResult | null> => {
    // Validate language support
    const mappedLanguage = mapLanguage(language);
    if (!mappedLanguage) {
      const error = `Language "${language}" is not supported yet. Currently supported: python, javascript`;
      const errorResult: ExecutionResult = {
        success: false,
        error,
      };
      updateSharedState(false, errorResult, error);
      setExecutionError(error);
      setExecutionResult(errorResult);
      return null;
    }

    // Validate inputs
    if (!code || code.trim().length === 0) {
      const error = 'Code cannot be empty';
      const errorResult: ExecutionResult = {
        success: false,
        error,
      };
      updateSharedState(false, errorResult, error);
      setExecutionError(error);
      setExecutionResult(errorResult);
      return null;
    }

    if (!testcases || testcases.length === 0) {
      const error = 'No test cases provided';
      const errorResult: ExecutionResult = {
        success: false,
        error,
      };
      updateSharedState(false, errorResult, error);
      setExecutionError(error);
      setExecutionResult(errorResult);
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
      // Update shared state - this will sync to all users
      updateSharedState(true, null, null);
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

      // Update shared state with result - this will sync to all users
      updateSharedState(false, result, null);
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

      // Update shared state with error - this will sync to all users
      updateSharedState(false, result, errorMessage);
      setExecutionError(errorMessage);
      setExecutionResult(result);
      return result;
    } finally {
      // Ensure isExecuting is set to false in shared state
      // Note: The actual result/error is already set in try/catch blocks above
      const executionMap = executionMapRef.current;
      if (executionMap) {
        executionMap.set('isExecuting', false);
      }
      setIsExecuting(false);
    }
  };

  const clearResults = () => {
    updateSharedState(false, null, null);
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
