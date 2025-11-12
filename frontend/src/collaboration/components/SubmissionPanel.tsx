import {useEffect, useState} from 'react';
import {Send, Eye, LogOut, Mic, Video, ChevronLeft, ChevronRight} from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import {ChatPanel} from './ChatPanel';
import YPartyKitProvider from 'y-partykit/provider';
import type {AwarenessUser} from '../hooks/useCollabRoom';

export default function SubmissionPanel({
  isPenaltyOver,
  handleLeaveRoom,
  isCollapsed,
  onToggle,
  provider,
}: {
  isPenaltyOver: boolean;
  handleLeaveRoom: () => void;
  isCollapsed: boolean;
  onToggle: () => void;
  provider: YPartyKitProvider | null;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [users, setUsers] = useState<AwarenessUser[]>([]);

  function handleEndSession() {
    setIsDialogOpen(true);
  }

  async function handleEarlySessionEnd() {
    // TODO: Add service call here for early session end tracking
  }

  async function handleConfirmEndSession() {
    if (!isPenaltyOver) {
      await handleEarlySessionEnd();
    }
    handleLeaveRoom();
  }

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
          <button className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2">
            <span>↑</span>
            <span>Submit Solution</span>
          </button>

          <button className="w-full border border-gray-300 hover:bg-gray-50 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2">
            <Eye size={18} />
            <span>View Solution</span>
          </button>

          <button
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2"
            onClick={handleEndSession}
          >
            <LogOut size={18} />
            <span>End Session {isPenaltyOver ?? '(Penalty)'}</span>
          </button>
        </div>
      </div>

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
