import {useEffect, useState} from 'react';
import {Eye, LogOut, Mic, Video, ChevronLeft, ChevronRight} from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import {ChatPanel} from './ChatPanel';
import YPartyKitProvider from 'y-partykit/provider';
import type {AwarenessUser} from '../hooks/useCollabRoom';
import axios from 'axios';
import type {ExecutionResult} from './CodeExecutionPanel';
import useAuth from '@/hooks/useAuth';

// const HISTORY_SERVICE_URL = import.meta.env.VITE_HISTORY_SERVICE_URL || 'http://localhost:8085';
const HISTORY_SERVICE_URL = 'http://localhost:8085';
const MATCHING_SERVICE_URL = 'http://localhost:8081';

export default function SubmissionPanel({
  isPenaltyOver,
  handleLeaveRoom,
  isCollapsed,
  onToggle,
  roomId,
  executionResult,
  sessionStartTime,
  provider,
}: {
  isPenaltyOver: boolean;
  handleLeaveRoom: () => void;
  isCollapsed: boolean;
  onToggle: () => void;
  roomId: string;
  executionResult: ExecutionResult | null;
  sessionStartTime: number;
  provider: YPartyKitProvider | null;
}) {
  const {user} = useAuth();
  const [users, setUsers] = useState<AwarenessUser[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLeavingRoom, setIsLeavingRoom] = useState(false);

  useEffect(() => {
    if (!provider) {
      setUsers([]);
      return;
    }

    const awareness = provider.awareness; // Get awareness from the provider

    const updateUsers = () => {
      const states = Array.from(awareness.getStates().values());
      const userList = states.map(state => state.user).filter(Boolean) as AwarenessUser[];
      setUsers(userList);
    };

    awareness.on('change', updateUsers);
    updateUsers(); // Initial load

    return () => {
      awareness.off('change', updateUsers);
      setUsers([]); // Cleanup state
    };
  }, [provider]);

  const localUser = provider?.awareness.getLocalState()?.user as AwarenessUser | undefined;

  // Find the first user in the list who is not the local user
  const otherUser = users.find(u => u.name !== localUser?.name);

  function handleEndSession() {
    setIsDialogOpen(true);
  }

  function handleRequestSubmit() {
    // Validate that code has been executed at least once
    if (!executionResult) {
      alert('Please run your code at least once before submitting.');
      return;
    }
    setIsSubmitDialogOpen(true);
  }

  async function handleIncurPenalty() {
    setIsLeavingRoom(true);
    try {
      const request = {
        userId: user._id,
        increment: 2,
      };
      const response = await axios.post(
        `${MATCHING_SERVICE_URL}/api/matches/penalty/incur`,
        request
      );

      console.log('Penalty incurred successfully:', response.data);
    } catch (error) {
      console.error('Error incurring penalty:', error);
      alert('Failed to leave room. Please try again.');
    } finally {
      setIsLeavingRoom(false);
    }
  }

  async function handleResetPenalty() {
    try {
      const request = {
        userId: user._id,
      };
      const response = await axios.post(
        `${MATCHING_SERVICE_URL}/api/matches/penalty/reset`,
        request
      );

      console.log('Penalty reset successfully:', response.data);
    } catch (error) {
      console.error('Error resetting penalty:', error);
      alert('Failed to leave room. Please try again.');
    }
  }

  async function handleConfirmEndSession() {
    if (!isPenaltyOver) {
      await handleIncurPenalty();
    }
    handleLeaveRoom();
  }

  async function handleConfirmSubmitSolution() {
    // Validate that we have the required data
    if (!user._id) {
      alert('User information not available. Please try again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const request = {
        sessionId: roomId,
        userId: user._id,
        code: provider?.doc.getText('codemirror').toString(),
        isSolvedSuccessfully: executionResult?.allPassed ?? false,
        hasPenalty: !isPenaltyOver,
        timeTakenMs: Date.now() - sessionStartTime,
      };

      const response = await axios.patch(
        `${HISTORY_SERVICE_URL}/api/history/complete-session`,
        request
      );

      console.log('Submission successful:', response.data);
      alert('Solution submitted successfully!');
      await handleResetPenalty();

      handleLeaveRoom();
    } catch (error) {
      console.error('Error submitting solution:', error);
      alert('Failed to submit solution. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCollapsed) {
    return (
      <div className="w-10 px-1 py-2 bg-white border-l border-gray-200">
        <button
          onClick={onToggle}
          className="w-full h-full flex rounded items-center justify-center hover:bg-blue-500 hover:text-white transition-colors"
          aria-label="Expand submission panel"
        >
          <ChevronLeft size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
      <div className="flex justify-end p-2 border-b border-gray-200 flex-shrink-0">
        <button
          onClick={onToggle}
          className="group p-2 hover:bg-blue-500 hover:text-white rounded transition-colors"
          aria-label="Collapse submission panel"
        >
          <ChevronRight size={20} className="text-gray-600 group-hover:text-white" />
        </button>
      </div>
      {/* User Avatars */}
      <div className="p-4 border-b border-gray-200 flex space-x-3">
        {localUser && (
          <div
            className="flex-1 rounded-lg p-4 text-white flex flex-col items-center justify-center"
            style={{backgroundColor: localUser.color}}
          >
            <Mic size={20} className="mb-1" />
            <Video size={20} className="mb-2" />
            <span className="font-semibold text-lg">{localUser.name} (You)</span>
          </div>
        )}
        {otherUser && (
          <div
            className="flex-1 rounded-lg p-4 text-white flex items-center justify-center"
            style={{backgroundColor: otherUser.color}}
          >
            <span className="font-semibold text-lg">{otherUser.name}</span>
          </div>
        )}
        {!otherUser && (
          <div className="flex-1 bg-gray-200 rounded-lg p-4 text-gray-500 flex items-center justify-center">
            <span className="font-semibold text-lg">Waiting...</span>
          </div>
        )}
      </div>

      {/*Chat Panel*/}
      <div className="flex-1 flex flex-col h-0">
        <ChatPanel provider={provider} />
      </div>

      <div className="p-4 border-t border-gray-200">
        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleRequestSubmit}
            disabled={isSubmitting || !executionResult}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2"
          >
            <span>↑</span>
            <span>{isSubmitting ? 'Submitting...' : 'Submit Solution'}</span>
          </button>

          <button className="w-full border border-gray-300 hover:bg-gray-50 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2">
            <Eye size={18} />
            <span>View Solution</span>
          </button>

          <button
            className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2"
            disabled={isLeavingRoom}
            onClick={handleEndSession}
          >
            <LogOut size={18} />
            <span>End Session {isPenaltyOver ?? '(Penalty)'}</span>
          </button>
        </div>
      </div>

      {/* Submit Solution Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isSubmitDialogOpen}
        onClose={() => setIsSubmitDialogOpen(false)}
        onConfirm={handleConfirmSubmitSolution}
        title="Confirm Submit?"
        message="This will end the session, submit your results, and both users will leave the room. Are you sure you want to proceed?"
        confirmText="Yes, Submit Solution"
        cancelText="Cancel"
        variant="normal"
      />

      {/* End Session Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleConfirmEndSession}
        title={isPenaltyOver ? 'End Session?' : 'End Session Early?'}
        message={
          isPenaltyOver
            ? 'The penalty period has ended. Ending the session now will not incur any penalties. Are you sure you want to end this session?'
            : 'Warning: Ending the session before the penalty period expires may result in penalties. Are you sure you want to end the session anyway?'
        }
        confirmText={isPenaltyOver ? 'Yes, End Session' : 'Yes, End Anyway'}
        cancelText={isPenaltyOver ? 'Cancel' : 'Stay in Session'}
        variant={isPenaltyOver ? 'normal' : 'warning'}
      />
    </div>
  );
}
