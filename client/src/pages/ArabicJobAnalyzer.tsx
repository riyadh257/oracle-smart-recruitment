import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Briefcase, Brain, Sparkles, TrendingUp, Target } from "lucide-react";

export default function ArabicJobAnalyzer() {
  const [jobText, setJobText] = useState("");
  const [analyzeResult, setAnalyzeResult] = useState<any>(null);

  const analyzeMutation = trpc.arabicNlp.analyzeJobDescription.useMutation({
    onSuccess: (data) => {
      setAnalyzeResult(data);
      toast.success("Job description analyzed successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to analyze job description");
    },
  });

  const handleAnalyze = () => {
    if (!jobText.trim()) {
      toast.error("Please enter job description text");
      return;
    }

    analyzeMutation.mutate({ text: jobText });
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "entry":
        return "bg-green-100 text-green-800";
      case "mid":
        return "bg-blue-100 text-blue-800";
      case "senior":
        return "bg-purple-100 text-purple-800";
      case "expert":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Brain className="w-4 h-4" />
            Advanced Arabic NLP - Job Analysis
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Arabic Job Description Analyzer
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI-powered analysis of Arabic job descriptions for better candidate matching
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Job Description Input
              </CardTitle>
              <CardDescription>
                Paste Arabic job description text
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jobText">Job Description (Arabic)</Label>
                <Textarea
                  id="jobText"
                  value={jobText}
                  onChange={(e) => setJobText(e.target.value)}
                  placeholder="الصق الوصف الوظيفي هنا..."
                  rows={15}
                  className="font-arabic"
                  dir="rtl"
                />
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={analyzeMutation.isPending || !jobText.trim()}
                className="w-full"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Brain className="w-4 h-4 mr-2 animate-pulse" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze Job Description
                  </>
                )}
              </Button>

              {/* Sample Text */}
              <div className="bg-gray-50 border rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Try a sample:</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setJobText(
                      "مطلوب مهندس برمجيات أول\n\nالمسؤوليات:\n- تطوير وصيانة تطبيقات الويب باستخدام React و Node.js\n- العمل مع فريق متعدد الوظائف لتصميم وتنفيذ ميزات جديدة\n- كتابة كود نظيف وقابل للصيانة\n- إجراء مراجعات الكود وتوجيه المطورين المبتدئين\n\nالمتطلبات:\n- 5+ سنوات خبرة في تطوير البرمجيات\n- إتقان JavaScript و TypeScript و Python\n- خبرة قوية في React و Node.js و Express\n- معرفة بقواعد البيانات SQL و NoSQL\n- خبرة في AWS أو Azure\n- مهارات تواصل ممتازة\n- درجة البكالوريوس في علوم الحاسب أو مجال ذي صلة\n\nالمزايا:\n- راتب تنافسي\n- تأمين صحي شامل\n- فرص التطوير المهني\n- بيئة عمل مرنة"
                    )
                  }
                >
                  Load Sample Job Description
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Analysis Results
              </CardTitle>
              <CardDescription>
                Extracted requirements and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyzeResult ? (
                <div className="space-y-6">
                  {/* Overall Analysis Score */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-blue-900">Analysis Quality</span>
                      <span className="text-2xl font-bold text-blue-700">
                        {(analyzeResult.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={analyzeResult.confidence * 100} className="h-2" />
                  </div>

                  {/* Job Title & Level */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Position Details</h3>
                    <div className="space-y-2">
                      {analyzeResult.jobTitle && (
                        <div className="flex items-start justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium">Title:</span>
                          <span className="text-sm">{analyzeResult.jobTitle}</span>
                        </div>
                      )}
                      {analyzeResult.seniorityLevel && (
                        <div className="flex items-start justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium">Level:</span>
                          <Badge className={getDifficultyColor(analyzeResult.seniorityLevel)}>
                            {analyzeResult.seniorityLevel}
                          </Badge>
                        </div>
                      )}
                      {analyzeResult.department && (
                        <div className="flex items-start justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium">Department:</span>
                          <span className="text-sm">{analyzeResult.department}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Required Skills */}
                  {analyzeResult.requiredSkills && analyzeResult.requiredSkills.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">Required Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {analyzeResult.requiredSkills.map((skill: any, index: number) => (
                          <Badge key={index} variant="default">
                            {skill.name}
                            {skill.yearsRequired && ` (${skill.yearsRequired}+ years)`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferred Skills */}
                  {analyzeResult.preferredSkills && analyzeResult.preferredSkills.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">Preferred Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {analyzeResult.preferredSkills.map((skill: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education Requirements */}
                  {analyzeResult.educationRequirements && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">Education</h3>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm">{analyzeResult.educationRequirements}</p>
                      </div>
                    </div>
                  )}

                  {/* Experience Requirements */}
                  {analyzeResult.experienceYears && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">Experience</h3>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium">
                            {analyzeResult.experienceYears}+ years required
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Responsibilities */}
                  {analyzeResult.responsibilities && analyzeResult.responsibilities.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">Key Responsibilities</h3>
                      <ul className="space-y-2">
                        {analyzeResult.responsibilities.map((resp: string, index: number) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <span className="text-blue-600 mt-1">•</span>
                            <span>{resp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Benefits */}
                  {analyzeResult.benefits && analyzeResult.benefits.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">Benefits</h3>
                      <div className="flex flex-wrap gap-2">
                        {analyzeResult.benefits.map((benefit: string, index: number) => (
                          <Badge key={index} variant="outline">
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Salary Range */}
                  {analyzeResult.salaryRange && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">Salary Range</h3>
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-900">
                          {analyzeResult.salaryRange}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No results yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Analyze a job description to see extracted information
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features Highlight */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Smart Extraction</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Automatically extract skills, requirements, and responsibilities from Arabic text
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Candidate Matching</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Use analyzed data to find the best candidates with AI-powered matching
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Insights & Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get insights on seniority level, market competitiveness, and skill demand
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
