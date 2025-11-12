import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getHistoryProgress, getAllAttemptSummaries } from '../lib/api';
import { useQuery } from '@tanstack/react-query';
import RecentSessionsList from '../features/progress/RecentSessionsList';
import StatsGrid from '../features/progress/statsGrid';

// --- UI Imports from Lovable's file ---
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// --- Imports from your original file (for profile pic) ---
import DefaultProfileIcon from '../assets/default-profile-icon.svg';
import OccupationIcon from '../assets/user-profile/work-case-icon.svg';
import AreaOfStudyIcon from '../assets/user-profile/graduation-hat-icon.svg';
import {OCCUPATIONS} from '../constants/occupation';
import {AREAS_OF_STUDY} from '../constants/areaOfStudy';

// NOTE: We are removing the import for '../../styles/userProfile.css'
// as the new UI is entirely driven by Tailwind classes.

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userId = (user as any)?._id ?? (user as any)?.uid ?? '';

  // Fetch user progress and session summaries using useQuery
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

  // We get the user data from the useAuth() hook
  const { username, email, occupation, areaOfStudy, googleOAuthEmail, githubOAuthEmail, createdAt, profilePicture } = user;
  const displayEmail = email ?? googleOAuthEmail ?? githubOAuthEmail;
  const occupationLabel = OCCUPATIONS.find(o => o.value === occupation)?.label || '';
  const areaOfStudyLabel = AREAS_OF_STUDY.find(o => o.value === areaOfStudy)?.label || '';


  // --- This is the new, beautiful UI from Lovable's file ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-accent">
      {/* Header */}
       
      <main className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Profile Header (with real data) */}
        <Card className="p-8 bg-card border-0 shadow-elegant mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            
            {/* --- FIX: Using your original <img> for profile picture --- */}
            <img
              src={profilePicture || DefaultProfileIcon}
              alt="Profile"
              // Added Tailwind classes to match Lovable's <Avatar> size
              className="h-32 w-32 rounded-full border-2 border-border"
            />
            {/* --- END FIX --- */}
            
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold mb-2">{username}</h1>
              <p className="text-muted-foreground mb-4">{displayEmail}</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {/* <Badge className="bg-primary text-primary-foreground">Intermediate</Badge> */}
                
                {/* --- FIX: Using your original logic for info badges --- */}
                <Badge variant="outline" className="border-2">
                  Member since{' '}
                  {new Date(createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </Badge>
                {occupationLabel && (
                  <Badge variant="outline" className="border-2 flex items-center gap-1">
                    <img src={OccupationIcon} alt="Occupation" className="h-4 w-4" />
                    {occupationLabel}
                  </Badge>
                )}
                {areaOfStudyLabel && (
                  <Badge variant="outline" className="border-2 flex items-center gap-1">
                    <img src={AreaOfStudyIcon} alt="Area of Study" className="h-4 w-4" />
                    {areaOfStudyLabel}
                  </Badge>
                )}
                {/* --- END FIX --- */}

              </div>
            </div>
          </div>
        </Card>

        {/* Stats Grid (with real data) - using reusable component */}
        {progressLoading ? (
          <div className="mb-8 text-center text-muted-foreground">Loading stats...</div>
        ) : progressError ? (
          <div className="mb-8 text-center text-red-500">Error loading stats</div>
        ) : (
          <div className="mb-8">
            <StatsGrid progress={progress} />
          </div>
        )}

        {/* Recent Sessions (using your existing RecentSessionsList component) */}
        {/* This section uses the beautiful layout from your screenshot and the logic from your file */}
        <div className="bg-card border-0 shadow-card rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Recent Sessions</h2>
            <Button 
              variant="outline"
              onClick={() => navigate("/history")}
              className="hover:shadow-card "
            >
              See All Sessions
            </Button>
          </div>
          {/* This renders your child component */}
          {summariesLoading ? (
            <div className="p-4 text-center text-muted-foreground">Loading recent sessions...</div>
          ) : summariesError ? (
            <div className="p-4 text-center text-red-500">Error loading recent sessions</div>
          ) : userId ? (
            <RecentSessionsList userId={userId} limit={5} summaries={summaries} />
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default UserProfile;