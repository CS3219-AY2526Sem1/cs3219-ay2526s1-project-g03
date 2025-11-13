import { Link } from 'react-router-dom';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/Logo";
import {
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Clock
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

// --- SYNTAX HIGHLIGHTING IMPORTS (THE FIX) ---
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'; 

// --- API & Auth Imports (from Logic) ---
import useAuth from '../hooks/useAuth';
import { getQuestionAttempts, getOtherUser } from '../lib/api';
import { formatDurationMinutes } from '../lib/timeFormatters';

// ... (interface Attempt definition is correct) ...
interface Attempt {
  participant_id: string;
  session_id: string;
  user_id: string;
  partner_id: string;
  code: string;
  is_solved_successfully: boolean;
  has_penalty: boolean;
  time_taken_ms: number;
  is_active_in_history: boolean;
  started_at: string;
  question_title: string;
}

export const QuestionDetail = () => {
  const navigate = useNavigate();
  const { questionId } = useParams<{ questionId: string }>();
  
  const { user } = useAuth();
  const userId = (user as any)?._id ?? (user as any)?.uid ?? '';
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [usernames, setUsernames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!userId || !questionId) return;
    
    setLoading(true);
    getQuestionAttempts(userId, questionId)
      .then(d => {
        setAttempts(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        setAttempts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId, questionId]);

  // Fetch usernames for all unique partner IDs
  useEffect(() => {
    if (attempts.length === 0) return;

    const fetchUsernames = async () => {
      const uniquePartnerIds = [...new Set(attempts.map(a => a.partner_id).filter(id => id))];
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
  }, [attempts]);

  const questionTitle = attempts[0]?.question_title;

  // --- Helper function to guess language ---
  // This is a simple guesser. You can improve it.
  const guessLanguage = (code: string) => {
    if (code.includes('def ') || code.includes('import ') || code.includes('print(')) {
      return 'python';
    }
    if (code.includes('function') || code.includes('const ') || code.includes('let ')) {
      return 'javascript';
    }
    if (code.includes('public static void main')) {
      return 'java';
    }
    return 'plaintext';
  };

  if (loading) {
     return (
       <div className="min-h-screen bg-gradient-to-br from-background to-background-accent flex items-center justify-center">
         <p className="text-muted-foreground">Loading attempts...</p>
       </div>
     );
  }

  if (!questionTitle && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-accent">
        {/* ... (Not Found page is correct) ... */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <Logo />
          </div>
        </header>
        <main className="container mx-auto px-6 py-8">
          <Card className="p-8 text-center bg-card border-0 shadow-card">
            <p className="text-muted-foreground">Question not found or no attempts made.</p>
            <Button 
              onClick={() => navigate("/history")}
              className="mt-4"
            >
              Back to History
            </Button>
          </Card>
        </main>
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

      <main className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Your Attempts for "{questionTitle}"
          </h1>
          <p className="text-muted-foreground">
            Review all your attempts and track your progress
          </p>
        </div>

        {/* --- Attempts List (Merged) --- */}
        <div className="space-y-6">
          {attempts.map((attempt, index) => (
            <Card 
              key={attempt.participant_id} 
              className="p-6 bg-card border-0 shadow-card hover:shadow-elegant transition-smooth"
            >
              {/* ... (Attempt Header is correct) ... */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold">
                    Attempt {attempts.length - index}
                  </h3>
                  {attempt.is_solved_successfully ? (
                    <Badge className="bg-green-500 text-white flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Passed
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500 text-white flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Failed
                    </Badge>
                  )}
                </div>
              </div>

              {/* ... (Attempt Metadata is correct) ... */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Partner: {usernames.get(attempt.partner_id) || attempt.partner_id}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(attempt.started_at).toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Time: {formatDurationMinutes(attempt.time_taken_ms)}
                </span>
              </div>

              {/* --- CODE BLOCK (THE FIX) --- */}
              <div>
                <p className="text-sm font-medium mb-2">Your Solution:</p>
                {/* We replace the <pre> tag with the <SyntaxHighlighter> component */}
                <SyntaxHighlighter
                  language={guessLanguage(attempt.code)}
                  style={vscDarkPlus} // Use the imported theme
                  className="rounded-lg border border-border" // Use Tailwind classes
                  customStyle={{
                    padding: '1rem',
                    fontSize: '0.875rem' // text-sm
                  }}
                  wrapLongLines={true}
                >
                  {attempt.code || "// No code submitted"}
                </SyntaxHighlighter>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
    </div>
  );
};

export default QuestionDetail;