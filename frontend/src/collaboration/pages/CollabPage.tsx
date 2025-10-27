import {useParams, useNavigate} from 'react-router-dom';
import CollabEditor from '../components/CollabEditor';
import {useState} from 'react';
import {Send, Code, Image, Play, Eye, LogOut, Mic, Video} from 'lucide-react';
import QuestionPanel from '../components/QuestionPanel';
import SessionHeader from '../components/SessionHeader';
import SubmissionPanel from '../components/SubmissionPanel';

export function CollabPage() {
  const {roomId} = useParams<{roomId: string}>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('code');

  if (!roomId) {
    navigate('/room');
    return null;
  }

  //TODO: handle leave room/exit - remove cursor and user from partykit room
  function handleLeaveRoom() {
    navigate('/room');
  }

  // return (
  // <div className="w-[75em] h-screen flex flex-col">
  //   <div className="p-2.5 mb-5 flex justify-between items-center w-full">
  //     <h2>Room: {roomId}</h2>
  //     <button
  //       onClick={handleLeaveRoom}
  //       className="px-4 py-2 bg-red-500 text-white border-none rounded cursor-pointer hover:bg-red-600"
  //     >
  //       Leave Room
  //     </button>
  //   </div>
  // <div className="flex h-screen flex-col">
  //   <SessionHeader sessionTime="15:42" penaltyTime="09:01" />
  //   <div className="flex flex-1 overflow-hidden">
  //     <QuestionPanel />

  //     <CollabEditor roomId={roomId} />

  //     <SubmissionPanel />
  //   </div>
  // </div>

  // );
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <SessionHeader />

      <div className="flex-1 flex overflow-hidden">
        <QuestionPanel />

        <div className="flex-1 flex flex-col bg-white">
          {/* Editor Header */}
          <div className="border-b border-gray-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center space-x-2 px-3 py-2 rounded ${
                  activeTab === 'code' ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
              >
                <Code size={16} />
                <span className="text-sm font-medium">Code</span>
              </button>
              <button
                onClick={() => setActiveTab('whiteboard')}
                className={`flex items-center space-x-2 px-3 py-2 rounded ${
                  activeTab === 'whiteboard' ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
              >
                <Image size={16} />
                <span className="text-sm font-medium">Whiteboard</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <select className="border border-gray-300 rounded px-3 py-1 text-sm">
                <option>Python</option>
                <option>JavaScript</option>
                <option>Java</option>
                <option>C++</option>
              </select>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm font-medium">You</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span className="text-sm font-medium">Alex</span>
              </div>
            </div>
          </div>

          {/* Code Editor Area */}
          <div className="flex-1 overflow-hidden">
            {/* Placeholder for CodeMirror component */}
            <CollabEditor roomId={roomId} />
          </div>

          {/* Test Results */}
          {/* <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-4 mb-4">
              <button className="text-sm font-medium text-gray-700 border-b-2 border-green-500 pb-1">
                Testcase
              </button>
              <button className="text-sm font-medium text-gray-500 pb-1">Test Result</button>
            </div>

            <div className="flex items-center space-x-2 mb-4">
              <span className="text-green-600 font-semibold">Accepted</span>
              <span className="text-gray-500 text-sm">Runtime: 0ms</span>
            </div>

            <div className="flex space-x-2 mb-4">
              <button className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                Case 1
              </button>
              <button className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded text-sm">
                Case 2
              </button>
              <button className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded text-sm">
                Case 3
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-600 mb-1">Input</div>
                <div className="bg-gray-100 p-2 rounded font-mono">num = [3,2,4]</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">target =</div>
                <div className="bg-gray-100 p-2 rounded font-mono">6</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Output</div>
                <div className="bg-gray-100 p-2 rounded font-mono">[2, 1]</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Expected</div>
                <div className="bg-gray-100 p-2 rounded font-mono">[2, 1]</div>
              </div>
            </div>
          </div> */}

          {/* Run Code Button */}
          <div className="border-t border-gray-200 px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-gray-500">Python 3.9 Line 20, Column 14</span>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded flex items-center space-x-2">
              <Play size={16} />
              <span>Run Code</span>
            </button>
          </div>
        </div>

        {/* Right Panel - Chat */}
        <SubmissionPanel />
      </div>
    </div>
  );
}
