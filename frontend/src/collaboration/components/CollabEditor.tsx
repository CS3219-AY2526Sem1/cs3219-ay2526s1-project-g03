import useCollabEditor from '../hooks/useCollabEditor';
import CodeMirror from './CodeMirror';
import React from 'react';

const LANGUAGE_OPTIONS = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
  { value: 'default', label: 'Plain Text' },
];

export default function CollabEditor({roomId}: {roomId: string}) {
  const {ytext, awareness, isReady, languageConfig, setSharedLanguage} = useCollabEditor({roomId});
  if (!isReady || !ytext) {
    return <div>Loading...</div>;
  }

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSharedLanguage(event.target.value);
  };

  return (
    <div style={{padding: '20px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
        <h2>Happy Coding :D</h2>
        <label>
          Language: 
          <select 
            value={languageConfig} 
            onChange={handleLanguageChange}
            style={{marginLeft: '10px', padding: '5px', borderRadius: '4px', border: '1px solid #ccc'}}
          >
            {LANGUAGE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <CodeMirror ytext={ytext} awareness={awareness} languageConfig={languageConfig} />
    </div>
  );
}
