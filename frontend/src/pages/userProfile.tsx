import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getHistoryProgress } from '../lib/api';
import { formatDuration } from '../lib/timeFormatters';
import RecentSessionsList from '../features/progress/RecentSessionsList';

// --- UI Imports from Lovable's file ---
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
// We won't import Avatar since you don't use it
// import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Target,
  Clock,
  TrendingUp,
} from "lucide-react";

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
  const [progress, setProgress] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;
    getHistoryProgress(userId)
      .then(setProgress)
      .catch(() => setProgress(null));
  }, [userId]);

  // We get the user data from the useAuth() hook
  const { username, email, occupation, areaOfStudy, googleOAuthEmail, githubOAuthEmail, createdAt, profilePicture } = user;
  const displayEmail = email ?? googleOAuthEmail ?? githubOAuthEmail;
  const occupationLabel = OCCUPATIONS.find(o => o.value === occupation)?.label || '';
  const areaOfStudyLabel = AREAS_OF_STUDY.find(o => o.value === areaOfStudy)?.label || '';


  // --- This is the Stats data structure from Lovable's file ---
  // --- We are populating it with REAL data from the `progress` state ---
  const stats = [
    { 
      label: "Sessions Completed", 
      value: progress?.total_sessions_completed ?? 0, 
      icon: Trophy, 
      color: "text-yellow-500" 
    },
    { 
      label: "Problems Solved", 
      value: progress?.total_successes ?? 0, 
      icon: Target, 
      color: "text-green-500" 
    },
    { 
      label: "Hours Practiced", 
      // Use the formatter
      value: formatDuration(progress?.total_time_ms), 
      icon: Clock, 
      color: "text-blue-500" 
    },
    { 
      label: "Current Streak", 
      value: progress?.current_streak ?? 0, 
      icon: TrendingUp, 
      color: "text-purple-500" 
    },
  ];

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

        {/* Stats Grid (with real data) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-6 bg-card border-0 shadow-card hover:shadow-elegant transition-smooth">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
                <stat.icon className={`h-10 w-10 ${stat.color}`} />
              </div>
            </Card>
          ))}
        </div>

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
          {userId && <RecentSessionsList userId={userId} limit={5} />}
        </div>
      </main>
    </div>
  );
};

export default UserProfile;