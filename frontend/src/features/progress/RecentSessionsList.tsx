import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllAttemptSummaries, getOtherUser } from '../../lib/api';
// --- FIX: Import both time formatters ---
import { formatDuration, formatTimeAgo } from '../../lib/timeFormatters';

// --- UI Imports from New UI ---
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Code
} from "lucide-react";
// ------------------------------------

// Define the type for a session summary based on your API
interface SessionSummary {
  question_id: string;
  session_id: string;
  question_title: string;
  question_difficulty: "Easy" | "Medium" | "Hard";
  partner_id: string;
  is_solved_successfully: boolean | null;
  has_penalty: boolean; // We need this to determine "Incomplete"
  started_at: string;
  time_taken_ms: number | null;
}

const RecentSessionsList: React.FC<{ userId: string, limit: number }> = ({ userId, limit }) => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [usernames, setUsernames] = useState<Map<string, string>>(new Map());

  // Fetch sessions
  useEffect(() => {
    if (!userId) return;

    const fetchRecent = async () => {
      try {
        setLoading(true);
        const data = await getAllAttemptSummaries(userId);
        // Sort by date DESC (as getAllAttemptSummaries might not guarantee order)
        const sortedData = data ? data.sort((a:SessionSummary, b:SessionSummary) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()) : [];
        setSessions(sortedData.slice(0, limit));
      } catch (error) {
        console.error("Failed to fetch recent sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecent();
  }, [userId, limit]);

  // Fetch usernames for all unique partner IDs
  useEffect(() => {
    if (sessions.length === 0) return;

    const fetchUsernames = async () => {
      const uniquePartnerIds = [...new Set(sessions.map(s => s.partner_id).filter(id => id))];
      const usernameMap = new Map<string, string>();

      // Fetch usernames in parallel
      await Promise.allSettled(
        uniquePartnerIds.map(async (partnerId) => {
          try {
            const response = await getOtherUser(partnerId);
            // getOtherUser returns { data: { username, ... } }
            if (response?.data?.username) {
              usernameMap.set(partnerId, response.data.username);
            } else {
              usernameMap.set(partnerId, partnerId);
            }
          } catch (error) {
            console.error(`Failed to fetch username for partner ${partnerId}:`, error);
            // Keep partner_id as fallback
            usernameMap.set(partnerId, partnerId);
          }
        })
      );

      setUsernames(usernameMap);
    };

    fetchUsernames();
  }, [sessions]);

  const handleSessionClick = (questionId: string) => {
    // Navigate to the detail page for that question
    navigate(`/history/attempts/${questionId}`);
  };

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Loading recent sessions...</div>;
  }

  if (sessions.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">No recent sessions found.</div>;
  }

  // --- This is the new UI, adapted to the REAL API data ---
  return (
    <div className="space-y-3">
      {/* The title "Recent Sessions" is in your userProfile.tsx, so we don't repeat it here */}
      {sessions.map((session) => {
        const statusText = session.is_solved_successfully === true ? "Passed" : (session.has_penalty ? "Incomplete" : "Failed");
        const statusColor = session.is_solved_successfully === true ? 'bg-green-500' : (session.has_penalty ? 'bg-orange-500' : 'bg-red-500');
        const difficultyColors: Record<string, { bg: string; text: string }> = {
          Easy: { bg: 'bg-green-100', text: 'text-green-800' },
          Medium: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
          Hard: { bg: 'bg-red-100', text: 'text-red-800' }
        };
        const difficultyStyle = difficultyColors[session.question_difficulty] || difficultyColors.Medium;
        
        return (
          <Card 
            key={session.session_id} 
            className="p-4 cursor-pointer"
            style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              border: '1px solid #e5e7eb'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            }}
            onClick={() => handleSessionClick(session.question_id)}
          >
            <div className="flex items-center gap-4">
              {/* Left: Code Icon */}
              <div 
                className="flex-shrink-0 flex items-center justify-center"
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#addaf7',
                  borderRadius: '8px'
                }}
              >
                <Code className="h-6 w-6 text-white" style={{ strokeWidth: 2.5 }} />
              </div>

              {/* Middle: Topic, Difficulty, Partner, Time */}
              <div className="flex-1 space-y-1">
                {/* Topic in bold */}
                <div className="font-bold text-base text-gray-900">
                  {session.question_title}
                </div>
                
                {/* Difficulty badge and Partner */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge 
                    className={`${difficultyStyle.bg} ${difficultyStyle.text} border-0 font-medium`}
                    style={{ fontSize: '12px', padding: '2px 8px' }}
                  >
                    {session.question_difficulty}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    with {usernames.get(session.partner_id) || session.partner_id}
                  </span>
                </div>

                {/* Time taken and Time ago */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {session.time_taken_ms && (
                    <span>{formatDuration(session.time_taken_ms)}</span>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatTimeAgo(session.started_at)}</span>
                  </div>
                </div>
              </div>

              {/* Right: Status Badge */}
              <div className="flex-shrink-0">
                <Badge 
                  className={`${statusColor} text-white border-0 font-medium`}
                  style={{ 
                    fontSize: '13px', 
                    padding: '4px 12px',
                    borderRadius: '9999px'
                  }}
                >
                  {statusText}
                </Badge>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

// We export `default` because your userProfile.tsx imports it as default
export default RecentSessionsList;