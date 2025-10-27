import {Send, Code, Image, Play, Eye, LogOut, Mic, Video} from 'lucide-react';

export default function SubmissionPanel() {
  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
      {/* User Avatars */}
      <div className="p-4 border-b border-gray-200 flex space-x-3">
        <div className="flex-1 bg-blue-500 rounded-lg p-4 text-white flex flex-col items-center justify-center">
          <Mic size={20} className="mb-1" />
          <Video size={20} className="mb-2" />
          <span className="font-semibold text-lg">You</span>
        </div>
        <div className="flex-1 bg-green-500 rounded-lg p-4 text-white flex items-center justify-center">
          <span className="font-semibold text-lg">Alex</span>
        </div>
      </div>

      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="font-semibold text-lg">Chat</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="text-left">
          <div className="text-xs text-gray-500 mb-1">Alex · 2:14 PM</div>
          <div className="inline-block bg-gray-100 rounded-lg px-3 py-2 text-sm">
            Hey! Ready to chat?
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-500 mb-1 text-right">You · 2:15 PM</div>
          <div className="inline-block bg-blue-500 text-white rounded-lg px-3 py-2 text-sm">
            Nope! This feature is under construction
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="flex items-center space-x-2 mb-3">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg">
          <Send size={18} />
        </button>
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

          <button className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2">
            <LogOut size={18} />
            <span>End Session (Penalty)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
