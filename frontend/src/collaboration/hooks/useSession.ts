import {useCallback, useState, useEffect, useRef} from 'react';
import axios from 'axios';

interface UseSessionReturn {
  sessionStartTime: number | null;
  isPenaltyOver: boolean;
  handlePenaltyOver: () => void;
  questionId: string;
  sessionIsLoading: boolean;
  sessionError: string | null;
}

/**
 * Fetch the creation timestamp of a collaboration room
 * @param roomId - The ID of the collaboration room
 * @returns Promise with roomId and createdAt timestamp
 */
export async function fetchRoomData(roomId: string): Promise<{
  id: string;
  user1: string;
  user2: string;
  question_id: string;
  created_at: string;
}> {
  const collaborationServiceUrl =
    import.meta.env.VITE_COLLABORATION_SERVICE_URL || 'http://localhost:8082';
  const response = await axios.get(`${collaborationServiceUrl}/parties/main/${roomId}`);
  console.log(`Response received: ${response}`);
  return response.data;
}

export function useSession(roomId: string | undefined): UseSessionReturn {
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [isPenaltyOver, setIsPenaltyOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const questionId = useRef<string>('');

  const handlePenaltyOver = useCallback(() => {
    setIsPenaltyOver(true);
    console.log('Penalty period has ended');
  }, []);

  useEffect(() => {
    if (!roomId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const roomData = await fetchRoomData(roomId);
        questionId.current = roomData.question_id;

        if (isMounted) {
          // Convert ISO string to timestamp
          const timestamp = new Date(roomData.created_at).getTime();
          setSessionStartTime(timestamp);
        }
      } catch (err) {
        console.error('Failed to fetch room timestamp:', err);
        if (isMounted) {
          setError('Failed to fetch session start time');
          // Fallback to current time if fetch fails
          setSessionStartTime(Date.now());
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  return {
    sessionStartTime,
    isPenaltyOver,
    handlePenaltyOver,
    questionId: questionId.current,
    sessionIsLoading: isLoading,
    sessionError: error,
  };
}
