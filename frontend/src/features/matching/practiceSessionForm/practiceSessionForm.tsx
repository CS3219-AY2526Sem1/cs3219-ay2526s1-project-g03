import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from "react-router";
import Chip from '../../../components/chip/chip';
import TopicSelector from '../topicSelector/topicSelector';
import MatchingStatusModal from '../matchingStatusModal/matchingStatusModal';
import MatchFoundModal from '../matchFoundModal/matchFoundModal';
import TimeoutModal from '../timeoutModal/timeoutModal';
import CodeIcon from '../../../assets/code-icon.svg';
import UserIcon from '../../../assets/user-icon-white.svg';
import { findMatch, cancelMatch, getOtherUser } from '../../../lib/api';
import useAuth from '../../../hooks/useAuth';
import type { MatchCriteria, MatchRequestPayload, MatchPayload} from '../../../models/match.model';
import './practiceSessionForm.css'

const INITIAL_SEARCH_COUNTDOWN = 30;
const EXTEND_SEARCH_COUNTDOWN = 60;

const difficulties: string[] = ['Easy', 'Medium', 'Hard'];
const languages: string[] = ['C++', 'Java', 'JavaScript', 'Python'];

const PracticeSessionForm = () => {
  let navigate = useNavigate();
  const {user} = useAuth();
  const {_id} = user;
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  // Modal States
  const [showWaitingModal, setShowWaitingModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);

  const [currentCriteria, setCurrentCriteria] = useState<MatchCriteria | null>(null);

  // Timer logics for matchingStatusModal
  const [searchCountdown, setSearchCountdown] = useState(INITIAL_SEARCH_COUNTDOWN); // The *total* duration
  const [timer, setTimer] = useState(INITIAL_SEARCH_COUNTDOWN); // The *current* time left
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Consolidate match state
  const [matchData, setMatchData] = useState<MatchPayload | null>(null); // From WebSocket
  const [partnerDetails, setPartnerDetails] = useState<any | null>(null); // TODO: change the any type to a predefined interface
  const [partnerHasAccepted, setPartnerHasAccepted] = useState<boolean>(false);

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (timer <= 0) {
      // Don't do anything if we're not in a "waiting" state
      if (!showWaitingModal || showTimeoutModal) {
        return;
      }
      // We are waiting, and the timer hit 0. Fire the timeout.
      handleSearchTimeout();
    }
  }, [timer, showWaitingModal, showTimeoutModal]); // Dependency on `timer`

  useEffect(() => {

    // dD not start the interval if timeout modal is showing
    if (showWaitingModal && !showTimeoutModal) {
      // Start the interval
      intervalRef.current = setInterval(() => {
        setTimer(prev => prev - 1); // Just tick down
      }, 1000);
    } else {
      // Otherwise, clear any interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    // Cleanup function:
    // This runs when the component unmounts or when the dependencies change.
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [showWaitingModal, showTimeoutModal]); // Dependencies for starting/stopping

  // --- END FIX ---

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
      // Re-register just in case
      ws.current?.send(JSON.stringify({type: 'register', userId: _id}));
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
          getPartnerMutate(message.payload.partnerId);
          setShowMatchModal(true);
          console.log(`Match found via WebSocket! Partner: ${message.payload.partnerId}`);
          break;

        case 'partner_accepted':
          setPartnerHasAccepted(true);
          console.log("Partner accepted.")
          toast.success('Your partner has accepted! Accept now to start collaborating1');
          break;

        case 'match_confirmed':
          console.log("Match confirmed by server! Navigating...");
          navigate(`/room/${message.payload.sessionId}`);
          break;

        case 'room_creation_failed':
          console.log("Server failed to create room.");
          setShowMatchModal(false);
          toast.error('Match failed: Could not create the collaboration room. Please try again.');
          resetState();
          break;

        case 'partner_declined':
          console.log("Partner declined. Returning to search...");
          setShowMatchModal(false);
          toast.error('Match Declined. Returning you to the queue...');
          // reset the state
          setPartnerDetails(null);
          setPartnerHasAccepted(false);
          // requeue them
          handleFindPartner();
          break;

        case 'match_penalty':
          toast.error(message.payload.message || 'You received a matchmaking penalty.');
          break;

        case 'partner_timed_out':
          // This is new: sent to the user who *did* accept
          console.log("Partner timed out. Returning to search...");
          setShowMatchModal(false);
          toast.error('Your partner timed out. Finding a new partner...');
          // reset the state
          setPartnerDetails(null);
          setPartnerHasAccepted(false);
          // requeue them
          handleFindPartner();
          break;

        case 'match_timed_out':
          // the server says the match is off.
          console.log("Match timed out from server.");
          setShowMatchModal(false);
          // The 'match_penalty' message will also be sent, so this toast is a fallback
          toast.error("You did not accept the match in time.");
          // reset the state
          setPartnerDetails(null);
          setPartnerHasAccepted(false);
          break;

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
        setShowWaitingModal(true);
        connectWebSocket();
      } else if (data.data.status === 'matched') {
        // Matched immediately!
        setMatchData(data.data);
        getPartnerMutate(data.data.partnerId);
        setShowMatchModal(true);
        console.log(`Match found immediately! Partner: ${data.data.partnerId}, Session: ${data.data.matchId}`);
        connectWebSocket(); // Connect now to handle accept/decline
      }
    },
    onError: (error: any) => {
      console.log('Error:', error);
      if (error.response && error.response.status === 429) {
        // Handle penalty cooldown
        const { cooldown } = error.response.data;
        toast.error(`You are on a cooldown. Please try again in ${cooldown} seconds.`);
      } else {
        toast.error(error.response?.data?.message || 'Failed to find a match. Please try again.');
      }
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

  const {
    mutate: getPartnerMutate,
    isPending: isGettingPartner,
  } = useMutation ({
    mutationFn: getOtherUser,
    onSuccess: (data) => {
      setPartnerDetails(data.data);
      console.log('Successfully get partner details, ', data)
    },
    onError: (data) => {
      console.log('Error getting partner details, ', data)
    }
  })

  const handleFindPartner = (isRequeue: boolean = false) => {
    if (!isRequeue && (showWaitingModal || showMatchModal)) {
      return;
    }

    const criteria: MatchCriteria = {difficulties: selectedDifficulties, languages: selectedLanguages, topics: selectedTopics};
    setCurrentCriteria(criteria);

    if (!isRequeue) {
      setSearchCountdown(INITIAL_SEARCH_COUNTDOWN);
      setTimer(INITIAL_SEARCH_COUNTDOWN);
    }

    const payload:  MatchRequestPayload= {userId: _id, criteria: criteria};
    findMatchMutate(payload);
  }

  const handleCancelSearch = () => {
    cancelMatchMutate({userId: _id});
  }


  const handleSearchTimeout = () => {
    console.log("Search timed out. Removing from the queue and showing options.");
    setShowTimeoutModal(true);
    handleCancelSearch(false);
  };

  // Called by TimeoutModal "Keep Waiting"
  const handleKeepWaiting = () => {
    console.log("Keeping waiting...");
    setSearchCountdown(EXTEND_SEARCH_COUNTDOWN); // Set new total
    setTimer(EXTEND_SEARCH_COUNTDOWN); // Set new current time
    setShowTimeoutModal(false);
    handleFindPartner(true);
  };

  // Called by TimeoutModal "Change Criteria"
  const handleChangeCriteria = () => {
    console.log("Stopping search and closing modals.");
    resetState();
    handleCancelSearch();
  };

  // Called by TimeoutModal "Stop Searching"
  const handleStopSearching = () => {
    navigate("/")
  }

  const handleAccept = () => {
    console.log("Accepting match...");
    ws.current?.send(JSON.stringify({ type: 'accept_match', matchId: matchData?.matchId }));
  }

  const handleDecline = () => {
    console.log("Declining match...");
    ws.current?.send(JSON.stringify({ type: 'decline_match', matchId: matchData?.matchId }));
    resetState();
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

  // Helper function
  const resetState = () => {
    setTimer(INITIAL_SEARCH_COUNTDOWN); // reset timer
    setShowMatchModal(false);
    setShowTimeoutModal(false);
    setShowWaitingModal(false);
    setMatchData(null);
    setPartnerDetails(null);
    setPartnerHasAccepted(false);
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
          countdown = {searchCountdown}
          timer={timer}
          usersOnline={116} // TODO: hardcorded
          avgWaitTime={45} // TODO: hardcoded
        />
      )}

      {showTimeoutModal && currentCriteria && (
        <TimeoutModal
          criteria={currentCriteria}
          waitedDuration={searchCountdown}
          onKeepWaiting={handleKeepWaiting}
          onChangeCriteria={handleChangeCriteria}
          onStopSearching={handleStopSearching}
        />
      )}

      {showMatchModal && partnerDetails && matchData && (
        <MatchFoundModal
          partner={partnerDetails}
          onAccept={() => handleAccept()}
          onDecline={() => handleDecline()}
          criteria={matchData.criteria}
          expiryTimestamp={matchData.expiryTimestamp}
          countdownDuration={matchData.totalDuration}
        />
      )}
    </div>
  );

};

export default PracticeSessionForm;