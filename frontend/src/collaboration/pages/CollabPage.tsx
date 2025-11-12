import {useParams, useNavigate} from 'react-router-dom';
import {useState} from 'react';
import CollabEditor from '../components/CollabEditor';
import QuestionPanel from '../components/QuestionPanel';
import SessionHeader from '../components/SessionHeader';
import SubmissionPanel from '../components/SubmissionPanel';
import {useSession} from '../hooks/useSession';
import {useCollabRoom} from '../hooks/useCollabRoom';
import {useQuestion} from '../hooks/useQuestion';
import {useCodeExecution} from '../hooks/useCodeExecution';
import CodeExecutionPanel from '../components/CodeExecutionPanel';

export function CollabPage() {
  const {roomId} = useParams<{roomId: string}>();
  const navigate = useNavigate();
  const [isQuestionPanelCollapsed, setIsQuestionPanelCollapsed] = useState(false);
  const [isCodeExecutionPanelCollapsed, setIsCodeExecutionPanelCollapsed] = useState(false);
  const [isSubmissionPanelCollapsed, setIsSubmissionPanelCollapsed] = useState(false);

  const {
    sessionStartTime,
    isPenaltyOver,
    handlePenaltyOver,
    questionId,
    sessionIsLoading,
    sessionError,
  } = useSession(roomId);
  const {question, testcases, questionIsLoading, questionError} = useQuestion(questionId);
  const {provider, isReady} = useCollabRoom(roomId || '');
  const {executeCode, isExecuting, executionResult, executionError} = useCodeExecution(provider);

  if (!roomId) {
    navigate('/room');
    return null;
  }

  if (!isReady || !provider) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-600">Connecting to collaboration session...</div>
      </div>
    );
  }

  const handleRun = async (code: string, language: string, testcases: string[]) => {
    await executeCode(code, language, testcases);
  };

  function handleLeaveRoom() {
    navigate('/room');
  }

  if (sessionIsLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-600">Loading session...</div>
      </div>
    );
  }

  if (sessionError) {
    console.warn('Session timestamp error:', sessionError);
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-50 overflow-hidden">
      <SessionHeader sessionStartTime={sessionStartTime} handlePenaltyOver={handlePenaltyOver} />

      <div className="flex-1 flex overflow-hidden min-w-0">
        <QuestionPanel
          question={question}
          isLoading={questionIsLoading}
          error={questionError}
          isCollapsed={isQuestionPanelCollapsed}
          onToggle={() => setIsQuestionPanelCollapsed(!isQuestionPanelCollapsed)}
        />

        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Code Editor Area */}
          <div
            className={`flex-1 min-h-0 flex flex-col overflow-hidden ${
              isCodeExecutionPanelCollapsed ? '' : 'border-b border-gray-200'
            }`}
          >
            <CollabEditor
              roomId={roomId}
              testcases={testcases}
              onRun={handleRun}
              isExecuting={isExecuting}
              provider={provider}
            />
          </div>

          {/* Test Results */}
          <CodeExecutionPanel
            testcases={testcases}
            isLoading={questionIsLoading}
            error={questionError}
            isCollapsed={isCodeExecutionPanelCollapsed}
            onToggle={() => setIsCodeExecutionPanelCollapsed(!isCodeExecutionPanelCollapsed)}
            executionResult={executionResult}
            isExecuting={isExecuting}
            executionError={executionError}
          />
        </div>

        {/* Right Panel - Chat */}
        <SubmissionPanel
          isPenaltyOver={isPenaltyOver}
          handleLeaveRoom={handleLeaveRoom}
          isCollapsed={isSubmissionPanelCollapsed}
          onToggle={() => setIsSubmissionPanelCollapsed(!isSubmissionPanelCollapsed)}
          roomId={roomId}
          executionResult={executionResult}
          sessionStartTime={sessionStartTime}
          provider={provider}
        />
      </div>
    </div>
  );
}
