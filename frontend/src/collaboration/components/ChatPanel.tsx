import React, {useState, useRef, useEffect} from 'react';
import YPartyKitProvider from 'y-partykit/provider';
import {Send} from 'lucide-react';
import {useChat, type ChatMessage} from '../hooks/useChat';

export function ChatPanel({provider}: {provider: YPartyKitProvider | null}) {
  const {messages, sendMessage, isReady} = useChat({provider});
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(newMessage);
    setNewMessage('');
  };

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
  }, [messages]);

  if (!isReady) {
    return <div className="p-4 text-sm text-gray-500">Chat connecting...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-800">Session Chat</h2>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <MessageItem key={msg.id} msg={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <form onSubmit={handleSend} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="off"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            disabled={!newMessage.trim()}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

function MessageItem({msg}: {msg: ChatMessage}) {
  const sentDate = new Date(msg.timestamp);
  const time = sentDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

  return (
    <div className="flex flex-col">
      <div className="flex items-center space-x-2">
        <span className="font-semibold text-sm text-gray-800">{msg.username}</span>
        <span className="text-xs text-gray-400">{time}</span>
      </div>
      <p className="text-sm text-gray-700">{msg.text}</p>
    </div>
  );
}
