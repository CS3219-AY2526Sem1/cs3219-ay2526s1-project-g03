import axios from 'axios';
import {useState, useEffect} from 'react';

interface QuestionData {
  question_id: string;
  title: string;
  description: string;
  difficulty: string;
  examples: string[];
  constraints: string[];
  testcases: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
}

/**
 * Fetch the question based on the question ID
 * @param questionId - The ID of the question
 * @returns Promise with QuestionData
 */
export async function fetchQuestion(questionId: string): Promise<QuestionData> {
  const questionServiceUrl = import.meta.env.VITE_QUESTION_SERVICE_URL || 'http://localhost:8083';

  const response = await axios.get(`${questionServiceUrl}/api/questions/${questionId}`);
  return response.data;
}

/**
 * Hook for fetching a question once on mount
 * @param questionId - The ID of the question to fetch
 * @returns Question data with loading and error states
 */
export function useQuestion(questionId: string | undefined) {
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!questionId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadQuestion = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const question = await fetchQuestion(questionId);

        if (isMounted) {
          setQuestion(question);
        }
      } catch (err) {
        console.error('Error fetching question:', err);
        if (isMounted) {
          setError('Failed to load question. Please try again.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadQuestion();

    return () => {
      isMounted = false;
    };
  }, [questionId]);

  return {question, isLoading, error};
}
