import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import Chip from '../../../components/chip/chip';
import TopicSelector from '../topicSelector/topicSelector';
import MatchingStatusModal from '../matchingStatusModal/matchingStatusModal';
import MatchFoundModal from '../matchFoundModal/matchFoundModal';
import CodeIcon from '../../../assets/code-icon.svg';
import UserIcon from '../../../assets/user-icon-white.svg';
import { findMatch, cancelMatch } from '../../../lib/api';
import useAuth from '../../../hooks/useAuth';
import type { MatchCriteria, MatchRequestPayload, MatchPayload} from '../../../models/match.model';
import './practiceSessionForm.css'

const difficulties: string[] = ['Easy', 'Medium', 'Hard'];
const languages: string[] = ['C++', 'Java', 'JavaScript', 'Python'];

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
  const [partnerHasAccepted, setPartnerHasAccepted] = useState<boolean>(false);

  useEffect(() => {
    // cleanup function: close WebSocket if component unmounts while waiting
    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        console.log("Closing WebSocket connection on unmount");
        ws.current.close();
      }
    };
  }, []); // run only on mount/unmount

  const connectWebSocket = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected.');
      return;
    }

    // Get URL from .env (VITE_MATCHING_SERVICE_WS_URL)
    const websocketUrl = import.meta.env.VITE_MATCHING_SERVICE_WS_URL;
    ws.current = new WebSocket(websocketUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connection opened');
      ws.current?.send(JSON.stringify({type: 'register', userId: _id}));
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('WebSocket message received:', message);

      switch (message.type) {
        case 'match_found':
          setShowWaitingModal(false);
          setMatchData(message.payload);
          setPartnerDetails({id: message.payload.userId, name: "Alex"}); //TODO: fetch partner details
          setShowMatchModal(true);
          console.log(`Match found via WebSocket! Partner: ${matchData?.partnerId}, Session: ${matchData?.sessionId}`);
          break;

        case 'partner_accepted':
          setPartnerHasAccepted(true);
          console.log("Partner accepted.")
          toast.success('Your partner has accepted! Accept now to start collaborating1');
          break;

        case 'match_confirmed':
          console.log("Match confirmed by server! Navigating...");
          // navigate(`/room/${message.payload.sessionId}`);
          break;

        case 'partner_declined':
          console.log("Partner declined. Returning to search...");
          setShowMatchModal(false);
          toast.error('Match Declined. Returning you to the queue...');
          // reset the state
          setPartnerDetails(null);
          // requeue them
          handleFindPartner();
          break

        default:
          console.warn(`Unknown message type received: ${message.type}`);
      }
    };
  }

  const {
    mutate: findMatchMutate,
    isPending: isFinding,
    isError: isFindError,
    error: findError,
  } = useMutation({
    mutationFn: findMatch,
    onSuccess: (data) => {
      console.log('Success:', data);
      if (data.data.status == 'waiting') {
        setCurrentCriteria({difficulties: selectedDifficulties, languages: selectedLanguages, topics: selectedTopics});
        setShowWaitingModal(true);
        connectWebSocket();
      } else if (data.data.status === 'matched') {
        // Matched immediately!
        setMatchData(data.data);
        setPartnerDetails({id: data.data.partnerId, name: "Alex"});
        setShowMatchModal(true);
        console.log(`Match found immediately! Partner: ${data.data.partnerId}, Session: ${data.data.sessionId}`);
        connectWebSocket(); // Connect now to handle accept/decline
      }
    },
      onError: (data) => {
      console.log('Error:', data);
    }
  });

  const {
    mutate: cancelMatchMutate,
    isPending: isCancelling,
    isError: isCancelError,
    error: cancelError,
  } = useMutation({
    mutationFn: cancelMatch,
    onSuccess: (data) => {
      setShowWaitingModal(false);
      console.log('Successfully cancel match, ', data)
    },
    onError: (data) => {
      console.log('Error:', data);
  }
  })

  const handleFindPartner = () => {
    const criteria: MatchCriteria = {difficulties: selectedDifficulties, languages: selectedLanguages, topics: selectedTopics};
    const payload:  MatchRequestPayload= {userId: _id, criteria: criteria};
    findMatchMutate(payload);
  }

  const handleCancelSearch = () => {
    cancelMatchMutate({userId: _id});
  }

  const handleAccept = () => {
    console.log("Accepting match...");
    ws.current?.send(JSON.stringify({ type: 'accept_match', sessionId: matchData?.sessionId }));
  }

  const handleDecline = () => {
    console.log("Declining match...");
    ws.current?.send(JSON.stringify({ type: 'decline_match', sessionId: matchData?.sessionId }));
    setShowMatchModal(false);
    setMatchData(null);
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

      <button className="find-partner-button" onClick={() => handleFindPartner()} disabled={isFinding}>
        <img src={UserIcon} alt="Find a Partner" className="user-icon" />
        <span> Find a Partner </span>
      </button>
      {showWaitingModal && currentCriteria && (
        <MatchingStatusModal
          criteria = {currentCriteria}
          onCancel = {handleCancelSearch}
          disabled = {isCancelling}
          initialCountdown = {30}
          usersOnline={116} // TODO: hardcorded
          avgWaitTime={45} // TODO: hardcoded
        />
      )}
      {showMatchModal && partnerDetails && matchData && (
        <MatchFoundModal
          partner={partnerDetails}
          onAccept={() => handleAccept()}
          onDecline={() => handleDecline()}
        />
      )}
    </div>
  );

};

export default PracticeSessionForm;