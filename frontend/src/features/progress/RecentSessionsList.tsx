import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllAttemptSummaries } from '../../lib/api';
// --- FIX: Import both time formatters ---
import { formatDuration, formatTimeAgo } from '../../lib/timeFormatters';
// import useAuth from '../hooks/useAuth'; // Added useAuth to get the user

// --- UI Imports from New UI ---
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Clock,
  Calendar // Added for "time ago"
} from "lucide-react";
// ------------------------------------

// Define the type for a session summary based on your API
interface SessionSummary {
  question_id: string;
  session_id: string;
  question_title: string;
  question_difficulty: "Easy" | "Medium" | "Hard";
  partner_id: string;
  is_solved_successfully: boolean;
  has_penalty: boolean; // We need this to determine "Incomplete"
  started_at: string;
  time_taken_ms: number;
}

const RecentSessionsList: React.FC<{ userId: string, limit: number }> = ({ userId, limit }) => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="space-y-4">
      {/* The title "Recent Sessions" is in your userProfile.tsx, so we don't repeat it here */}
      <div className="space-y-3">
        {sessions.map((session) => (
          <Card 
            key={session.session_id} 
            className="p-4 shadow-soft hover:shadow-card transition-smooth cursor-pointer"
            onClick={() => handleSessionClick(session.question_id)}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={session.question_difficulty} // Use Easy, Medium, Hard variants
                  >
                    {session.question_difficulty}
                  </Badge>
                  {/* API provides question_title, not topic */}
                  <span className="font-medium text-sm">{session.question_title}</span> 
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {session.partner_id}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {/* API provides time_taken_ms, format it */}
                    {formatDuration(session.time_taken_ms)} 
                  </div>
                  {/* API provides started_at, let's show time ago */}
                   <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatTimeAgo(session.started_at)}
                  </div>
                </div>
              </div>
              
              {/* API provides booleans, we derive the status */}
              <Badge className={
                session.is_solved_successfully ? 'bg-green-500 text-white' : // "Passed" (blue)
                session.has_penalty ? 'bg-orange-500 text-white' : // "Incomplete" (gray)
                'bg-red-500 text-white' // "Failed" (red)
              }>
                {session.is_solved_successfully ? "Passed" : (session.has_penalty ? "Incomplete" : "Failed")}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// We export `default` because your userProfile.tsx imports it as default
export default RecentSessionsList;