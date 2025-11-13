import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// --- UI Imports (from Lovable's file) ---
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Code2,
  User,
  RotateCcw
} from "lucide-react";

// --- Logic Imports (from Cursor's file) ---
import useAuth from '../hooks/useAuth';
import { getHistoryProgress, getAllAttemptSummaries, getOtherUser } from '../lib/api';
import { formatTimeAgo } from '../lib/timeFormatters';

// --- Main Component ---
export default function HistoryDashboardPage() {
  const { user } = useAuth();
  const userId = (user as any)?._id ?? (user as any)?.uid ?? '';
  const navigate = useNavigate();

  // --- State (from Cursor's file) ---
  const [progress, setProgress] = useState<any>(null);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usernames, setUsernames] = useState<Map<string, string>>(new Map());

  // --- Data Fetching (from Cursor's file) ---
  useEffect(() => {
    if (!userId) return;
    
    setLoading(true);
    Promise.all([
      getHistoryProgress(userId),
      getAllAttemptSummaries(userId)
    ]).then(([progressData, summariesData]) => {
      setProgress(progressData);
      setSummaries(Array.isArray(summariesData) ? summariesData : []);
    }).catch(err => {
      console.error("Failed to fetch history data", err);
      setProgress(null);
      setSummaries([]);
    }).finally(() => {
      setLoading(false);
    });
  }, [userId]);

  // Fetch usernames for all unique partner IDs
  useEffect(() => {
    if (summaries.length === 0) return;

    const fetchUsernames = async () => {
      const uniquePartnerIds = [...new Set(summaries.map((s: any) => s.partner_id).filter((id: string) => id))];
      const usernameMap = new Map<string, string>();

      // Fetch usernames in parallel
      await Promise.allSettled(
        uniquePartnerIds.map(async (partnerId: string) => {
          try {
            const response = await getOtherUser(partnerId);
            if (response?.data?.username) {
              usernameMap.set(partnerId, response.data.username);
            } else {
              usernameMap.set(partnerId, partnerId);
            }
          } catch (error) {
            console.error(`Failed to fetch username for partner ${partnerId}:`, error);
            usernameMap.set(partnerId, partnerId);
          }
        })
      );

      setUsernames(usernameMap);
    };

    fetchUsernames();
  }, [summaries]);

  // --- Stat Calculation (from Cursor's file, adapted for Lovable's UI) ---
  const totals = useMemo(() => {
    const uniqueQuestions = summaries.length; // Renamed to match UI
    const passed = progress?.total_successes ?? 0;
    const failed = (progress?.total_sessions_completed ?? 0) - passed;
    const totalSessions = progress?.total_sessions ?? 0;
    const incomplete = (progress?.total_sessions ?? 0) - (progress?.total_sessions_completed ?? 0);
    const passRate = progress?.success_rate ?? 0;
    return { uniqueQuestions, passed, failed, totalSessions, incomplete, passRate };
  }, [summaries, progress]);

  const passRatePercent = Math.round(totals.passRate * 100);

  const handleQuestionClick = (questionId: string) => {
    navigate(`/history/attempts/${questionId}`); // Corrected navigation
  };

  // --- Render Function ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-accent flex items-center justify-center">
        <p>Loading history...</p>
      </div>
    );
  }

  return (
    
    <div className="min-h-screen bg-gradient-to-br from-background to-background-accent">
      {/* Header (from Lovable's file) */}
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div>
        <Link to="/profile" className="back-link">
          <span className="back-arrow"/>
          <span>Back to Profile</span>
        </Link>
      </div>
      {/* Main Content (from Lovable's file) */}
      <main className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Question History</h1>
          <p className="text-muted-foreground">
            Track your progress across all coding challenges
          </p>
        </div>

        {/* --- Stats Cards  */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 bg-card border-0 shadow-card hover:shadow-elegant transition-smooth">
            <p className="text-sm text-muted-foreground mb-2">Total Unique Questions</p>
            <p className="text-3xl font-bold">{totals.uniqueQuestions}</p>
          </Card>
          <Card className="p-6 bg-card border-0 shadow-card hover:shadow-elegant transition-smooth">
            <p className="text-sm text-muted-foreground mb-2">Total Sessions</p>
            <p className="text-3xl font-bold">{totals.totalSessions}</p>
          </Card>
          <Card className="p-6 bg-card border-0 shadow-card hover:shadow-elegant transition-smooth">
            <p className="text-sm text-muted-foreground mb-2">Pass Rate</p>
            <p className="text-3xl font-bold text-blue-500">{passRatePercent}%</p>
          </Card>
          <Card className="p-6 bg-card border-0 shadow-card hover:shadow-elegant transition-smooth">
            <p className="text-sm text-muted-foreground mb-2">Passed Sessions</p>
            <p className="text-3xl font-bold text-green-500">{totals.passed}</p>
          </Card>
          <Card className="p-6 bg-card border-0 shadow-card hover:shadow-elegant transition-smooth">
            <p className="text-sm text-muted-foreground mb-2">Incomplete Sessions</p>
            <p className="text-3xl font-bold text-orange-500">{totals.incomplete}</p>
          </Card>
          <Card className="p-6 bg-card border-0 shadow-card hover:shadow-elegant transition-smooth">
            <p className="text-sm text-muted-foreground mb-2">Failed Sessions</p>
            <p className="text-3xl font-bold text-red-500">{Math.max(0, totals.failed)}</p>
          </Card>
          
          
        </div>

        {/* Reset Questions Button (from Lovable's file) */}
        <div className="mb-6">
          <Button 
            onClick={() => navigate("/history/reset")} // Corrected navigation
            className="bg-blue-500 text-white hover:bg-blue-600"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Questions
          </Button>
        </div>

        {/* --- History List (Lovable's UI + Cursor's Data) --- */}
        <Card className="p-6 bg-card border-0 shadow-card">
          <h2 className="text-xl font-semibold mb-6">Your Question Attempts</h2>
          <div className="space-y-4">
            {summaries.length > 0 ? (
              summaries.map((question) => (
                <div 
                  key={question.question_id} // Real data
                  className="p-4 border-2 border-border rounded-lg hover:shadow-card hover:border-primary/50 transition-smooth cursor-pointer"
                  onClick={() => handleQuestionClick(question.question_id)} // Real data
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-primary-glow/20 rounded-lg">
                        <Code2 className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{question.question_title}</h3>
                          {/* Real data */}
                          {question.is_solved_successfully ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {/* Real data - show first topic */}
                          <Badge variant="outline" className="border-2">
                            {question.question_topics[0]}
                          </Badge>
                          <Badge 
                            variant="outline"
                            // Real data
                            className={
                              question.question_difficulty === "Easy" 
                                ? "border-[hsl(var(--easy))] text-[hsl(var(--easy))]"
                                : question.question_difficulty === "Medium"
                                ? "border-[hsl(var(--medium))] text-[hsl(var(--medium))]"
                                : "border-[hsl(var(--hard))] text-[hsl(var(--hard))]"
                            }
                          >
                            {question.question_difficulty}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Partner: {usernames.get(question.partner_id) || question.partner_id}
                          </span>
                          <span>
                            {/* Real data */}
                            {formatTimeAgo(question.started_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-10 text-muted-foreground">
                <p>No activity found.</p>
                <p className="text-sm">Complete a session to see your history!</p>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
    </div>
  );
}