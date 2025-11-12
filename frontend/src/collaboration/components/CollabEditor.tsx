import type YPartyKitProvider from 'y-partykit/provider';
import useCollabEditor from '../hooks/useCollabEditor';
import CodeMirror from './CodeMirror';
import React, {useState} from 'react';
import {Code, Image, Play} from 'lucide-react';

const LANGUAGE_OPTIONS = [
  {value: 'python', label: 'Python'},
  {value: 'javascript', label: 'JavaScript'},
  {value: 'cpp', label: 'C++'},
  {value: 'java', label: 'Java'},
  {value: 'default', label: 'Plain Text'},
];

export default function CollabEditor({
  roomId,
  testcases,
  onRun,
  isExecuting,
  provider,
}: {
  roomId: string;
  testcases: string[] | null;
  onRun: (code: string, language: string, testcases: string[]) => void;
  isExecuting?: boolean;
  provider: YPartyKitProvider;
}) {
  // const {ytext, awareness, isReady, languageConfig, setSharedLanguage} = useCollabEditor({roomId});
  const {ytext, awareness, isReady, languageConfig, setSharedLanguage} = useCollabEditor({
    roomId,
    provider,
  });

  if (!isReady || !ytext) {
    return <div>Loading...</div>;
  }

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSharedLanguage(event.target.value);
  };

  const handleRun = () => {
    if (!testcases || testcases.length === 0) {
      return;
    }
    const code = ytext.toString();
    onRun(code, languageConfig, testcases);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with tabs and language selector */}
      <div className="flex items-center px-4 justify-between w-full border-b border-gray-200 py-2 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <button className={`flex items-center space-x-2 px-3 py-2 rounded 'bg-gray-100'}`}>
            <Code size={16} />
            <span className="text-sm font-medium">Code</span>
          </button>
        </div>

        <div className="flex items-center space-x-2"></div>
        <label>
          Language:
          <select
            value={languageConfig}
            onChange={handleLanguageChange}
            style={{
              marginLeft: '10px',
              padding: '5px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          >
            {LANGUAGE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* CodeMirror editor - scrollable */}
      <div className="flex-1 overflow-auto">
        <CodeMirror ytext={ytext} awareness={awareness} languageConfig={languageConfig} />
      </div>

      {/* Footer with Run button */}
      <div className="pl-4 py-1.5 pr-2 flex justify-between items-center flex-shrink-0">
        <span className="text-sm text-gray-500">Python 3.9 Line 20, Column 14</span>
        <button
          onClick={handleRun}
          disabled={!testcases || testcases.length === 0 || isExecuting}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-5 py-1.5 rounded-lg flex items-center space-x-2"
        >
          {/* <Play size={16} /> */}
          <span className="text-sm font-medium">Run</span>
        </button>
      </div>
    </div>
  );
}
