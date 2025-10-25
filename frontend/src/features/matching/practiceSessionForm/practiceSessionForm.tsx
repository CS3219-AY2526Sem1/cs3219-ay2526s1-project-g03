import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import Chip from '../../../components/chip/chip';
import TopicSelector from '../topicSelector/topicSelector';
import MatchingStatusModal from '../matchingStatusModal/matchingStatusModal';
import MatchFoundModal from '../matchFoundModal/matchFoundModal';
import CodeIcon from '../../../assets/code-icon.svg';
import UserIcon from '../../../assets/user-icon-white.svg';
import { findMatch } from '../../../lib/api';
import useAuth from '../../../hooks/useAuth';
import type { MatchCriteria, MatchRequestPayload, MatchPayload} from '../../../models/match.model';
import './practiceSessionForm.css'

const difficulties: string[] = ['Easy', 'Medium', 'Hard'];
const languages: string[] = ['C++', 'Java', 'Java Script', 'Python'];

const PracticeSessionForm = () => {
  const {user} = useAuth();
  const {_id} = user;
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [showWaitingModal, setShowWaitingModal] = useState(false);
  const [currentCriteria, setCurrentCriteria] = useState<MatchCriteria | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const [matchData, setMatchData] = useState<MatchPayload | null>(null); // From WebSocket
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [partnerDetails, setPartnerDetails] = useState<any | null>(null); // TODO: change the any type to a predefined interface

  useEffect(() => {
    // cleanup function: close WebSocket if component unmounts while waiting
    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        console.log("Closing WebSocket connection on unmount");
        ws.current.close();
      }
    };
  }, []); // run only on mount/unmount

  const {
    mutate: matchFinding,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: findMatch,
    onSuccess: (data) => {
      console.log('Success:', data);
      if (data.data.status == 'waiting') {
        setCurrentCriteria({ difficulties: selectedDifficulties, languages: selectedLanguages, topics: selectedTopics});
        setShowWaitingModal(true);
        const websocketUrl = import.meta.env.VITE_MATCHING_SERVICE_WS_URL;

        if (!websocketUrl) {
          console.error("WebSocket URL is not defined in .env file!");
          return;
        }

        ws.current = new WebSocket(websocketUrl);

        // this serve as a registration to the websocket so that websocket knows which user to message to when a match is found
        ws.current.onopen = () => {
          console.log('WebSocket connection opened');
          ws.current?.send(JSON.stringify({ type: 'register', userId: _id }));
        };

        ws.current.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('WebSocket message received:', message);
            if (message.type === 'match_found') {
              setShowWaitingModal(false);
              setMatchData(message.payload);
              setPartnerDetails({id: message.payload.userId, name: "Alex" });
              setShowMatchModal(true);
              console.log(`Match found via WebSocket! Partner: ${matchData.partnerId}, Session: ${matchData.sessionId}`);
              // TODO: Navigate to session page using message.payload.sessionId
              ws.current?.close(); // Close the connection
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        ws.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          // TODO: Handle error, maybe close modal and show error message
          setShowWaitingModal(false);
        };

        ws.current.onclose = () => {
          console.log('WebSocket connection closed');
          ws.current = null; // Clean up ref
        };

      } else if (data.data.status == 'matched') {
        console.log(`Matched immediately with ${data.data.partnerId}. Session: ${data.data.sessionId}`);
        setMatchData({partnerId: data.data.partnerId, sessionId: data.data.sessionId});
        setPartnerDetails({id: data.data.partnerId, name: "Alex" });
        setShowMatchModal(true);
      }
    },
    onError: (data) => {
      console.log('Error:', data);
    }
  });

  const handleFindPartner = () => {
    const criteria: MatchCriteria = {difficulties: selectedDifficulties, languages: selectedLanguages, topics: selectedTopics};
    const payload:  MatchRequestPayload= {userId: _id, criteria: criteria};
    matchFinding(payload);
  }

  const handleCancelSearch = () => {
    // TODO: make an API to remove the user from the queue
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      console.log("Closing WebSocket connection due to cancellation");
      ws.current.close();
    }
    setShowWaitingModal(false);
  }

  const handleAccept = (sessionId: string) => {
    // TODO: navigate to session
  }

  const handleDecline = (partnerId: string) => {
    setShowMatchModal(false);
    // TODO: put the partner back into the queue?
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
      {showWaitingModal && currentCriteria && (
        <MatchingStatusModal
          criteria = {currentCriteria}
          onCancel = {handleCancelSearch}
          initialCountdown = {30}
          usersOnline={116} // TODO: hardcorded
          avgWaitTime={45} // TODO: hardcoded
        />
      )}
      {showMatchModal && partnerDetails && matchData && (
        <MatchFoundModal
          partner={partnerDetails}
          onAccept={() => handleAccept(matchData.sessionId)}
          onDecline={() => handleDecline(matchData.partnerId)}
        />
      )}
    </div>
  );

};

export default PracticeSessionForm;