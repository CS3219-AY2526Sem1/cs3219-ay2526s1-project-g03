import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, RotateCcw, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// --- API & Auth Imports ---
import useAuth from '../hooks/useAuth';
import { getTopics, getActiveAttempts, getAllAttemptSummaries, resetQuestions } from '../lib/api';
import { formatDuration } from '../lib/timeFormatters';

// --- Types (from API) - Updated to match SessionSummary from history-service ---
interface QuestionSummary {
  session_id: string;
  question_id: string;
  question_title: string;
  question_topics: string[];
  question_difficulty: "Easy" | "Medium" | "Hard";
  started_at: string;
  partner_id: string;
  partner_username?: string;
  is_solved_successfully: boolean | null;
  has_penalty: boolean;
  time_taken_ms: number | null;
}

// Format date to YYYY-MM-DD
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ResetQuestions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = (user as any)?._id ?? (user as any)?.uid ?? '';

  // --- UI State ---
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTopic, setFilterTopic] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");

  // --- FIX #1: Add state to control the dialog ---
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  // --- Data Fetching using useQuery (like profile page) ---
  const { data: allSummaries = [], isLoading: summariesLoading, isError: summariesError } = useQuery({
    queryKey: ['attemptSummaries', userId],
    queryFn: () => getAllAttemptSummaries(userId),
    enabled: !!userId,
  });

  const { data: activeIds = [], isLoading: activeLoading } = useQuery({
    queryKey: ['activeAttempts', userId],
    queryFn: () => getActiveAttempts(userId),
    enabled: !!userId,
  });

  const { data: topics = [], isLoading: topicsLoading } = useQuery({
    queryKey: ['topics'],
    queryFn: () => getTopics(),
  });

  const loading = summariesLoading || activeLoading || topicsLoading;

  // --- Filter Logic ---
  const activeQuestions = allSummaries.filter((s: QuestionSummary) => activeIds.includes(s.question_id));

  const filteredQuestions = activeQuestions.filter((question: QuestionSummary) => {
    const matchesSearch = question.question_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (question.question_topics || []).some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTopic = filterTopic === "all" || (question.question_topics || []).includes(filterTopic);
    const matchesDifficulty = filterDifficulty === "all" || question.question_difficulty === filterDifficulty;
    return matchesSearch && matchesTopic && matchesDifficulty;
  });

  // --- Event Handlers ---
  const handleQuestionToggle = (questionId: string, checked: boolean) => {
    if (checked) {
      setSelectedQuestions(prev => [...prev, questionId]);
    } else {
      setSelectedQuestions(prev => prev.filter(id => id !== questionId));
    }
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredQuestions.map((q: QuestionSummary) => q.question_id);
    setSelectedQuestions(allFilteredIds);
  };

  const handleDeselectAll = () => {
    setSelectedQuestions([]);
  };

  // --- API Call ---
  const handleResetQuestions = async () => {
    if (selectedQuestions.length === 0) {
      toast({
        title: "No questions selected",
        description: "Please select at least one question to reset.",
        variant: "destructive"
      });
      setIsAlertOpen(false);
      return;
    }

    try {
      await resetQuestions(userId, selectedQuestions);
      
      toast({
        title: "Questions Reset!",
        description: `${selectedQuestions.length} question${selectedQuestions.length !== 1 ? 's' : ''} reset successfully.`,
      });
      
      setSelectedQuestions([]);
      
      // Invalidate and refetch queries to update the UI
      await queryClient.invalidateQueries({ queryKey: ['attemptSummaries', userId] });
      await queryClient.invalidateQueries({ queryKey: ['activeAttempts', userId] });
      await queryClient.invalidateQueries({ queryKey: ['historyProgress', userId] });
      
      // Close the dialog after successful reset
      setIsAlertOpen(false);

    } catch (error) {
      console.error("Failed to reset questions:", error);
      toast({
        title: "Error",
        description: "Failed to reset questions. Please try again.",
        variant: "destructive"
      });
      // Close the dialog even on error
      setIsAlertOpen(false);
    }
  };

  // --- Recommendations ---
  const getRecommendations = () => {
    const completedTopics = new Set<string>();
    allSummaries.forEach((q: QuestionSummary) => {
      if (q.question_topics && Array.isArray(q.question_topics)) {
        q.question_topics.forEach((t: string) => completedTopics.add(t));
      }
    });
    const allTopics = Array.isArray(topics) ? topics : [];
    const untriedTopics = allTopics.filter((topic: string) => !completedTopics.has(topic));
    return untriedTopics.slice(0, 3);
  };

  // --- Sort topics for display ---
  const sortedTopics = Array.isArray(topics) ? [...topics].sort() : [];

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        
        <div>
        <Link to="/history" className="back-link">
          <span className="back-arrow"/>
          <span>Back to History</span>
        </Link>
        </div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Questions</h1>
          <p className="text-gray-600">
            Select completed questions to reset and make them available for reattempting
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters and Controls */}
          <div className="lg:col-span-1">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Filters & Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-gray-200"
                  />
                </div>

                {/* Topic Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Topic</label>
                  <Select value={filterTopic} onValueChange={setFilterTopic}>
                    <SelectTrigger className="border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">All Topics</SelectItem>
                      {sortedTopics.map(topic => (
                        <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Difficulty Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Difficulty</label>
                  <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                    <SelectTrigger className="border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">All Difficulties</SelectItem>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="my-4" />

                {/* Selection Actions */}
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSelectAll}
                    className="w-full border-gray-200 hover:bg-gray-50"
                  >
                    Select All Visible
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDeselectAll}
                    className="w-full border-gray-200 hover:bg-gray-50"
                  >
                    Deselect All
                  </Button>
                </div>

                {/* Selected Count */}
                <div className="text-sm text-gray-600 pt-2">
                  {selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''} selected
                </div>
              </CardContent>
            </Card>

            {/* Suggestions */}
            <Card className="mt-4 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Try these unexplored topics:
                </p>
                <div className="space-y-2">
                  {getRecommendations().length > 0 ? (
                    getRecommendations().map(topic => (
                      <Badge 
                        key={topic} 
                        variant="secondary" 
                        className="w-full justify-center py-2 bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                      {topic}
                    </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No suggestions available</p>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4 border-gray-200 hover:bg-gray-50"
                  onClick={() => navigate("/home")}
                >
                  Explore New Topics
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Questions List */}
          <div className="lg:col-span-3">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    Completed Questions ({filteredQuestions.length})
                  </CardTitle>
                  
                  {/* --- FIX #4: Control the AlertDialog's open state --- */}
                  <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                    <AlertDialogTrigger asChild>
                      <Button 
                        disabled={selectedQuestions.length === 0}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset Selected ({selectedQuestions.length})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset Selected Questions?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will reset {selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''} and make them available for reattempting. 
                          Your previous solutions and completion history will be archived but not deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        {/* This button now works because it's wired to `onOpenChange` */}
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        {/* This button now calls the async handler, which will close the dialog when done */}
                        <AlertDialogAction onClick={handleResetQuestions}>
                          Reset Questions
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading questions...</div>
                  ) : summariesError ? (
                    <div className="text-center py-8 text-red-500">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Error loading questions. Please try again.</p>
                    </div>
                  ) : filteredQuestions.length > 0 ? (
                    filteredQuestions.map((question: QuestionSummary) => (
                      <div 
                        key={question.question_id}
                        className={`p-4 border rounded-lg transition-all ${
                          selectedQuestions.includes(question.question_id) 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedQuestions.includes(question.question_id)}
                            onCheckedChange={(checked) => 
                              handleQuestionToggle(question.question_id, checked as boolean)
                            }
                            className="mt-1"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900 text-base">
                                {question.question_title}
                              </h3>
                              <Badge variant={question.question_difficulty as "Easy" | "Medium" | "Hard"}>
                                {question.question_difficulty}
                              </Badge>
                              {(question.question_topics || []).slice(0, 2).map((topic: string) => (
                                <Badge key={topic} variant="secondary" className="bg-gray-100 text-gray-700">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span>Completed {formatDate(question.started_at)}</span>
                              </div>
                              {question.time_taken_ms && (
                                <div>Time: {formatDuration(question.time_taken_ms)}</div>
                              )}
                              {question.partner_username && (
                                <div>Partner: {question.partner_username}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No questions found matching your criteria.</p>
                      <p className="text-sm mt-1">Try adjusting your filters or search query.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetQuestions;