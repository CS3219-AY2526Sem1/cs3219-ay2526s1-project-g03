import React from 'react';
import { Card } from "@/components/ui/card";
import {
  Trophy,
  Target,
  Clock,
  TrendingUp,
} from "lucide-react";
import { formatDuration } from '../../lib/timeFormatters';

interface Stat {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface StatsGridProps {
  progress: {
    total_sessions_completed?: number;
    total_successes?: number;
    total_time_ms?: number;
    current_streak?: number;
  } | null;
}

const StatsGrid: React.FC<StatsGridProps> = ({ progress }) => {
  const stats: Stat[] = [
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

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
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
  );
};

export default StatsGrid;
