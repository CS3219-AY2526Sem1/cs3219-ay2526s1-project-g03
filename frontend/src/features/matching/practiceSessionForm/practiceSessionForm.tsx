import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Chip from '../../../components/chip/chip';
import TopicSelector from '../topicSelector/topicSelector';
import CodeIcon from '../../../assets/code-icon.svg';
import UserIcon from '../../../assets/user-icon-white.svg';
import { findMatch } from '../../../lib/api';
import './practiceSessionForm.css'


const difficulties: string[] = ['Easy', 'Medium', 'Hard'];
const languages: string[] = ['C++', 'Java', 'Java Scrpt', 'Python'];


const PracticeSessionForm = () => {
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const {
    mutate: matchFinding,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: findMatch,
    onSuccess: (data) => {
      console.log('Success:', data);
      },
    onError: (data) => {
      console.log('Error:', data);
    }
  });

  const userId = '123'  // TODO: use API to fecth real user id

  const handleFindPartner = () => {
    const payload = {userId, selectedDifficulties, selectedTopics};
    matchFinding(payload);
  }

  const handleSelect = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (list.includes(item)) {
      // deselect
      setList(list.filter(i => i !== item));
    } else {
      // select
      setList([...list, item]);
    }
  }


  return (
    <div className="practice-form-container">
      <h2><img src={CodeIcon} alt="Start Practice Session" className="code-icon" /> Start Practice Session</h2>
      <div className="default-note">
        <div className="lightBulb"> 💡</div>
        <p> Skipped a section? We’ll include all options! </p>
      </div>
      <div className="field-group">
        <div className="field-group-header">
          <h2> Question Difficulty </h2>
          <span> (Select as many as you like!) </span>
        </div>
        <div className="chip-group">
          {difficulties.map(diff => (
            <Chip
              key={diff}
              label={diff}
              isSelected={selectedDifficulties.includes(diff)}
              onClick={() => handleSelect(diff, selectedDifficulties, setSelectedDifficulties)}
              type={diff.toLowerCase()}
            />
          ))}
        </div>
      </div>

      <div className="field-group">
        <div className="field-group-header">
          <h2> Language Preference </h2>
          <span> (Select as many as you like!) </span>
        </div>
        <div className="chip-group">
          {languages.map(lang => (
            <Chip
              key={lang}
              label={lang}
              isSelected={selectedLanguages.includes(lang)}
              onClick={() => handleSelect(lang, selectedLanguages, setSelectedLanguages)}
            />
          ))}
        </div>
      </div>

      <div className="field-group">
        <div className="field-group-header">
          <h2> Topic </h2>
          <span> (Select as many as you like!)</span>
        </div>
        <TopicSelector
          currentSelection={selectedTopics}
          onSelectionChange={setSelectedTopics} // Pass the state setter function
        />
      </div>

      <button className="find-partner-button" onClick={() => handleFindPartner()} disabled={isPending}>
        <img src={UserIcon} alt="Find a Partner" className="user-icon" />
        <span> Find a Partner </span>
      </button>
    </div>
  );

};

export default PracticeSessionForm;