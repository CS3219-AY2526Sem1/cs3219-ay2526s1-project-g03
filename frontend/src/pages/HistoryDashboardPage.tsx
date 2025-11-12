import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// --- UI Imports (from Lovable's file) ---
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RotateCcw } from "lucide-react";

// --- Logic Imports (from Cursor's file) ---
import useAuth from '../hooks/useAuth';
import { getHistoryProgress, getAllAttemptSummaries } from '../lib/api';
import RecentSessionsList from '../features/progress/RecentSessionsList';

// --- Main Component ---
export default function HistoryDashboardPage() {
  const { user } = useAuth();
  const userId = (user as any)?._id ?? (user as any)?.uid ?? '';
  const navigate = useNavigate();

  // --- Data Fetching using useQuery ---
  const {data: progress, isLoading: progressLoading, isError: progressError} = useQuery({
    queryKey: ['historyProgress', userId],
    queryFn: () => getHistoryProgress(userId),
    enabled: !!userId,
  });

  const {data: summaries, isLoading: summariesLoading, isError: summariesError} = useQuery({
    queryKey: ['attemptSummaries', userId],
    queryFn: () => getAllAttemptSummaries(userId),
    enabled: !!userId,
  });

  const loading = progressLoading || summariesLoading;

  // --- Stat Calculation (from Cursor's file, adapted for Lovable's UI) ---
  const totals = useMemo(() => {
    const uniqueQuestions = (summaries?.length ?? 0); // Renamed to match UI
    const passed = progress?.total_successes ?? 0;
    const failed = (progress?.total_sessions_completed ?? 0) - passed;
    const totalSessions = progress?.total_sessions ?? 0;
    const incomplete = (progress?.total_sessions ?? 0) - (progress?.total_sessions_completed ?? 0);
    const passRate = progress?.success_rate ?? 0;
    return { uniqueQuestions, passed, failed, totalSessions, incomplete, passRate };
  }, [summaries, progress]);

  const passRatePercent = Math.round(totals.passRate * 100);

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
            onClick={() => navigate("/history/reset", { state: { from: 'history' } })}
            className="bg-blue-500 text-white hover:bg-blue-600"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Questions
          </Button>
        </div>

        {/* --- History List (using RecentSessionsList component) --- */}
        <Card className="p-6 bg-card border-0 shadow-card">
          <h2 className="text-xl font-semibold mb-6">Your Question Attempts</h2>
          {summariesLoading ? (
            <div className="p-10 text-center text-muted-foreground">Loading attempts...</div>
          ) : summariesError ? (
            <div className="p-10 text-center text-red-500">Error loading attempts</div>
          ) : userId ? (
            <RecentSessionsList userId={userId} summaries={summaries} />
          ) : (
            <div className="text-center p-10 text-muted-foreground">
              <p>No activity found.</p>
              <p className="text-sm">Complete a session to see your history!</p>
            </div>
          )}
        </Card>
      </main>
    </div>
    </div>
  );
}