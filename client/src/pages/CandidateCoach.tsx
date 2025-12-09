import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Bot, FileText, TrendingUp, MessageSquare, Sparkles, Send } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Streamdown } from "streamdown";

export default function CandidateCoach() {
  const [, setLocation] = useLocation();
  const [sessionType, setSessionType] = useState<"resume_review" | "career_path" | "interview_prep" | "general">("general");
  const [userQuery, setUserQuery] = useState("");
  const [currentResponse, setCurrentResponse] = useState<any>(null);

  const { data: history, refetch: refetchHistory } = trpc.coaching.getHistory.useQuery();
  const startSession = trpc.coaching.startSession.useMutation({
    onSuccess: (data) => {
      setCurrentResponse(data);
      setUserQuery("");
      refetchHistory();
    }
  });

  const handleSubmit = () => {
    if (!userQuery.trim()) return;
    startSession.mutate({ sessionType, userQuery });
  };

  const coachingTypes = [
    {
      type: "resume_review" as const,
      icon: FileText,
      title: "Resume Review",
      description: "Get expert feedback on your resume structure, content, and ATS optimization"
    },
    {
      type: "career_path" as const,
      icon: TrendingUp,
      title: "Career Path",
      description: "Explore career progression opportunities and skill development priorities"
    },
    {
      type: "interview_prep" as const,
      icon: MessageSquare,
      title: "Interview Prep",
      description: "Prepare for interviews with practice questions and expert strategies"
    },
    {
      type: "general" as const,
      icon: Bot,
      title: "General Advice",
      description: "Ask anything about job search, networking, or professional development"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/candidate/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Bot className="h-6 w-6 text-blue-600" />
              AI Career Coach
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* AI Coach Info Banner */}
        <Card className="mb-8 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-2">AI-Powered Career Guidance</h3>
                <p className="text-sm text-slate-600">
                  Get personalized career advice powered by advanced AI. Our coach provides expert guidance on resume optimization,
                  career planning, interview preparation, and professional development—available 24/7.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Coaching Types */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Choose Coaching Type</h2>
            <div className="space-y-3">
              {coachingTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Card
                    key={type.type}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      sessionType === type.type ? "border-blue-500 bg-blue-50" : ""
                    }`}
                    onClick={() => setSessionType(type.type)}
                  >
                    <CardHeader className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          sessionType === type.type ? "bg-blue-100" : "bg-slate-100"
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            sessionType === type.type ? "text-blue-600" : "text-slate-600"
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm mb-1">{type.title}</CardTitle>
                          <CardDescription className="text-xs">{type.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>

            {/* Recent Sessions */}
            {history && history.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Sessions</h2>
                <div className="space-y-2">
                  {history.slice(0, 5).map((session: any) => (
                    <Card key={session.id} className="p-3 hover:shadow-sm transition-shadow cursor-pointer">
                      <p className="text-xs text-slate-600 mb-1 capitalize">{session.sessionType.replace('_', ' ')}</p>
                      <p className="text-sm text-slate-900 line-clamp-2">{session.userQuery}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-600" />
                  Chat with AI Coach
                </CardTitle>
                <CardDescription>
                  Ask your career questions and get personalized, actionable advice
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Response Display */}
                {currentResponse ? (
                  <div className="flex-1 mb-4 overflow-y-auto">
                    <div className="space-y-6">
                      {/* Main Response */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900 mb-2">AI Coach Response</p>
                            <div className="text-slate-700 prose prose-sm max-w-none">
                              <Streamdown>{currentResponse.response}</Streamdown>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actionable Advice */}
                      {currentResponse.actionableAdvice && currentResponse.actionableAdvice.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-600" />
                            Actionable Advice
                          </h3>
                          <ul className="space-y-2">
                            {currentResponse.actionableAdvice.map((advice: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="h-5 w-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <span className="text-slate-700">{advice}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Resources */}
                      {currentResponse.resources && currentResponse.resources.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-green-600" />
                            Recommended Resources
                          </h3>
                          <ul className="space-y-2">
                            {currentResponse.resources.map((resource: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="text-green-600">•</span>
                                <span>{resource}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Next Steps */}
                      {currentResponse.nextSteps && currentResponse.nextSteps.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-orange-600" />
                            Next Steps
                          </h3>
                          <ul className="space-y-2">
                            {currentResponse.nextSteps.map((step: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="text-orange-600">→</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center mb-4">
                    <div>
                      <Bot className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">Start a Coaching Session</h3>
                      <p className="text-slate-600 max-w-md">
                        Select a coaching type and ask your question to get personalized AI-powered career guidance
                      </p>
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="border-t pt-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder={`Ask about ${sessionType.replace('_', ' ')}...`}
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                      className="flex-1 min-h-[80px]"
                      disabled={startSession.isPending}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-xs text-slate-500">
                      Press Enter to send, Shift+Enter for new line
                    </p>
                    <Button
                      onClick={handleSubmit}
                      disabled={!userQuery.trim() || startSession.isPending}
                    >
                      {startSession.isPending ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Thinking...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
