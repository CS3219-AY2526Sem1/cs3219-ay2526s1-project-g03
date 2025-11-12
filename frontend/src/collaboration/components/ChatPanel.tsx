import React, {useState, useRef, useEffect} from 'react';
import YPartyKitProvider from 'y-partykit/provider';
import {Send} from 'lucide-react';
import {useChat, type ChatMessage} from '../hooks/useChat';

export function ChatPanel({provider}: {provider: YPartyKitProvider | null}) {
  const {messages, sendMessage, isReady, username} = useChat({provider});
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessage(newMessage);
    setNewMessage('');
  };

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

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <MessageItem key={msg.id} msg={msg} isCurrentUser={msg.username === username} />
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
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
            disabled={!newMessage.trim()}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

function MessageItem({msg, isCurrentUser}: {msg: ChatMessage; isCurrentUser: boolean}) {
  const sentDate = new Date(msg.timestamp);
  const time = sentDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        {/* Username and timestamp */}
        <div className="flex items-center space-x-2 mb-1 px-1">
          {!isCurrentUser && (
            <>
              <span className="font-semibold text-xs text-gray-700">{msg.username}</span>
              <span className="text-xs text-gray-400">{time}</span>
            </>
          )}
          {isCurrentUser && (
            <>
              <span className="text-xs text-gray-400">{time}</span>
              <span className="font-semibold text-xs text-gray-700">You</span>
            </>
          )}
        </div>

        {/* Message bubble */}
        <div
          className={`px-4 py-2 rounded-2xl ${
            isCurrentUser
              ? 'bg-blue-500 text-white rounded-tr-sm'
              : 'bg-gray-100 text-gray-800 rounded-tl-sm'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap wrap-break-word">{msg.text}</p>
        </div>
      </div>
    </div>
  );
}
