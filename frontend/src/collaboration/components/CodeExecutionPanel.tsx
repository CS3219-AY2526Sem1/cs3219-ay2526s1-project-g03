import {useState, useEffect} from 'react';
import {ChevronUp, ChevronDown} from 'lucide-react';

export interface TestCase {
  input: string;
  expected: string;
}

export interface TestResult {
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  executionTime: number;
  error?: string;
}

export interface ExecutionResult {
  success: boolean;
  results?: TestResult[];
  allPassed?: boolean;
  error?: string;
}

export default function CodeExecutionPanel({
  testcases,
  isLoading,
  error,
  isCollapsed,
  onToggle,
  executionResult,
  isExecuting,
  executionError,
}: {
  testcases: string[] | null;
  isLoading: boolean;
  error: string | null;
  isCollapsed: boolean;
  onToggle: () => void;
  executionResult?: ExecutionResult | null;
  isExecuting?: boolean;
  executionError?: string | null;
}) {
  const [selectedCase, setSelectedCase] = useState(0);
  const [activeTab, setActiveTab] = useState<'testcase' | 'result'>('testcase');

  useEffect(() => {
    if (isExecuting) {
      setActiveTab('result');
    }
  }, [isExecuting]);

  // Update selectedCase if it's out of bounds
  useEffect(() => {
    const maxCaseIndex =
      activeTab === 'testcase'
        ? (testcases?.length ?? 0) - 1
        : (executionResult?.results?.length ?? 0) - 1;

    if (maxCaseIndex >= 0 && selectedCase > maxCaseIndex) {
      setSelectedCase(maxCaseIndex);
    }
  }, [activeTab, testcases, executionResult, selectedCase]);

  const parseTestCase = (testCase: string) => {
    if (!testCase) {
      return {input: '', output: ''};
    }
    const inputMatch = testCase.match(/Input:\s*(.+?)(?=\nOutput:)/s);
    const outputMatch = testCase.match(/Output:\s*(.+?)(?=\n|$)/);

    return {
      input: inputMatch ? inputMatch[1].trim() : '',
      output: outputMatch ? outputMatch[1].trim() : '',
    };
  };

  if (isCollapsed) {
    return (
      <div className="h-10 px-2 py-1 bg-white border-t border-gray-200 flex-shrink-0">
        <button
          onClick={onToggle}
          className="w-full h-full rounded flex items-center justify-center hover:bg-blue-500 hover:text-white transition-colors"
          aria-label="Expand code execution panel"
        >
          <ChevronUp size={20} />
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white border-t border-gray-200 overflow-y-auto p-6 flex flex-col flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('testcase')}
              className={`text-sm font-medium pb-1 ${
                activeTab === 'testcase'
                  ? 'text-gray-700 border-b-2 border-green-500'
                  : 'text-gray-500'
              }`}
            >
              Testcase
            </button>
            <button
              onClick={() => setActiveTab('result')}
              className={`text-sm font-medium pb-1 ${
                activeTab === 'result'
                  ? 'text-gray-700 border-b-2 border-green-500'
                  : 'text-gray-500'
              }`}
            >
              Test Result
            </button>
          </div>
          <button
            onClick={onToggle}
            className="group p-2 hover:bg-blue-500 hover:text-white rounded transition-colors flex-shrink-0"
            aria-label="Collapse code execution panel"
          >
            <ChevronDown size={20} className="text-gray-600 group-hover:text-white" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading question...</div>
        </div>
      </div>
    );
  }

  if (error || !testcases) {
    return (
      <div className="bg-white border-t border-gray-200 overflow-y-auto p-6 flex flex-col flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('testcase')}
              className={`text-sm font-medium pb-1 ${
                activeTab === 'testcase'
                  ? 'text-gray-700 border-b-2 border-green-500'
                  : 'text-gray-500'
              }`}
            >
              Testcase
            </button>
            <button
              onClick={() => setActiveTab('result')}
              className={`text-sm font-medium pb-1 ${
                activeTab === 'result'
                  ? 'text-gray-700 border-b-2 border-green-500'
                  : 'text-gray-500'
              }`}
            >
              Test Result
            </button>
          </div>
          <button
            onClick={onToggle}
            className="group p-2 hover:bg-blue-500 hover:text-white rounded transition-colors flex-shrink-0"
            aria-label="Collapse code execution panel"
          >
            <ChevronDown size={20} className="text-gray-600 group-hover:text-white" />
          </button>
        </div>
        <div className="text-red-500">{error || 'Question not found'}</div>
      </div>
    );
  }

  const currentCase = parseTestCase(testcases[selectedCase]);
  const hasResults = executionResult?.results && executionResult.results.length > 0;
  const allPassed = executionResult?.allPassed ?? false;

  // Ensure selectedCase is within bounds when switching tabs
  const maxCaseIndex =
    activeTab === 'testcase'
      ? (testcases?.length ?? 0) - 1
      : (executionResult?.results?.length ?? 0) - 1;

  const safeSelectedCase = Math.max(
    0,
    Math.min(selectedCase, maxCaseIndex >= 0 ? maxCaseIndex : 0)
  );

  return (
    <div className="p-4 border-t border-gray-200 flex flex-col flex-shrink-0 max-h-80 overflow-y-auto">
      <div className="flex-1 min-h-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('testcase')}
              className={`text-sm font-medium pb-1 ${
                activeTab === 'testcase'
                  ? 'text-gray-700 border-b-2 border-green-500'
                  : 'text-gray-500'
              }`}
            >
              Testcase
            </button>
            <button
              onClick={() => setActiveTab('result')}
              className={`text-sm font-medium pb-1 ${
                activeTab === 'result'
                  ? 'text-gray-700 border-b-2 border-green-500'
                  : 'text-gray-500'
              }`}
            >
              Test Result
            </button>
          </div>
          <button
            onClick={onToggle}
            className="group p-2 hover:bg-blue-500 hover:text-white rounded transition-colors flex-shrink-0"
            aria-label="Collapse code execution panel"
          >
            <ChevronDown size={20} className="text-gray-600 group-hover:text-white" />
          </button>
        </div>

        {activeTab === 'testcase' ? (
          <>
            {/* <div className="flex items-center space-x-2 mb-4">
              <span className="text-green-600 font-semibold">Accepted</span>
              <span className="text-gray-500 text-sm">Runtime: 0ms</span>
            </div> */}
            <div>
              {/* Dynamic buttons */}
              <div className="flex space-x-2 mb-4">
                {testcases.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedCase(index)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      selectedCase === index
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Case {index + 1}
                  </button>
                ))}
              </div>

              {/* Display selected case */}
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-600 mb-1">Input</div>
                  <div className="bg-gray-100 p-2 rounded font-mono">{currentCase.input}</div>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">Output</div>
                  <div className="bg-gray-100 p-2 rounded font-mono">{currentCase.output}</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {isExecuting ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Executing code...</div>
              </div>
            ) : executionError ? (
              <div className="text-red-500 py-4">{executionError}</div>
            ) : executionResult?.error ? (
              <div className="text-red-500 py-4">{executionResult.error}</div>
            ) : !hasResults ? (
              <div className="text-gray-500 py-4">
                No execution results yet. Click Run to execute your code.
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-2 mb-4">
                  {allPassed ? (
                    <>
                      <span className="text-green-600 font-semibold">Accepted</span>
                      {executionResult.results && executionResult.results.length > 0 && (
                        <span className="text-gray-500 text-sm">
                          Runtime: {Math.max(...executionResult.results.map(r => r.executionTime))}
                          ms
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-red-600 font-semibold">Wrong Answer</span>
                  )}
                </div>
                <div>
                  {/* Dynamic buttons for test results */}
                  <div className="flex space-x-2 mb-4 flex-wrap">
                    {executionResult.results?.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedCase(index)}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          safeSelectedCase === index
                            ? result.passed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                            : result.passed
                              ? 'text-green-700 hover:bg-green-50'
                              : 'text-red-700 hover:bg-red-50'
                        }`}
                      >
                        Case {index + 1} {result.passed ? '✓' : '✗'}
                      </button>
                    ))}
                  </div>

                  {/* Display selected result */}
                  {executionResult.results && executionResult.results[safeSelectedCase] && (
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="text-gray-600 mb-1">Input</div>
                        <div className="bg-gray-100 p-2 rounded font-mono">
                          {executionResult.results[safeSelectedCase].input || '(empty)'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Expected Output</div>
                        <div className="bg-gray-100 p-2 rounded font-mono">
                          {executionResult.results[safeSelectedCase].expected || '(empty)'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Your Output</div>
                        <div
                          className={`p-2 rounded font-mono ${
                            executionResult.results[safeSelectedCase].passed
                              ? 'bg-green-50 text-green-900'
                              : 'bg-red-50 text-red-900'
                          }`}
                        >
                          {executionResult.results[safeSelectedCase].actual || '(empty)'}
                        </div>
                      </div>
                      {executionResult.results[safeSelectedCase].error && (
                        <div>
                          <div className="text-red-600 mb-1">Error</div>
                          <div className="bg-red-50 p-2 rounded font-mono text-red-900">
                            {executionResult.results[safeSelectedCase].error}
                          </div>
                        </div>
                      )}
                      <div className="text-gray-500 text-xs">
                        Execution time: {executionResult.results[safeSelectedCase].executionTime}ms
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
