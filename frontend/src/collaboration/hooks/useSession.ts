import {useCallback, useState, useEffect} from 'react';
import axios from 'axios';

interface UseSessionReturn {
  sessionStartTime: number | null;
  isPenaltyOver: boolean;
  handlePenaltyOver: () => void;
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetch the creation timestamp of a collaboration room
 * @param roomId - The ID of the collaboration room
 * @returns Promise with roomId and createdAt timestamp
 */
export async function fetchRoomTimestamp(roomId: string): Promise<{
  roomId: string;
  createdAt: string;
}> {
  const collaborationServiceUrl =
    import.meta.env.VITE_COLLABORATION_SERVICE_URL || 'http://localhost:8082';
  const response = await axios.get(`${collaborationServiceUrl}/party/${roomId}`);
  return response.data;
}

export function useSession(roomId: string | undefined): UseSessionReturn {
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [isPenaltyOver, setIsPenaltyOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    const fetchTimestamp = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const {createdAt} = await fetchRoomTimestamp(roomId);

        if (isMounted) {
          // Convert ISO string to timestamp
          const timestamp = new Date(createdAt).getTime();
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

    fetchTimestamp();

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  return {sessionStartTime, isPenaltyOver, handlePenaltyOver, isLoading, error};
}
