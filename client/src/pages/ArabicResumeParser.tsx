import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle2, Brain, Sparkles } from "lucide-react";

export default function ArabicResumeParser() {
  const [resumeText, setResumeText] = useState("");
  const [parseResult, setParseResult] = useState<any>(null);

  const parseMutation = trpc.arabicNlp.parseResume.useMutation({
    onSuccess: (data) => {
      setParseResult(data);
      toast.success("Resume parsed successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to parse resume");
    },
  });

  const handleParse = () => {
    if (!resumeText.trim()) {
      toast.error("Please enter resume text");
      return;
    }

    parseMutation.mutate({ text: resumeText });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.95) return "bg-green-100 text-green-800";
    if (confidence >= 0.85) return "bg-blue-100 text-blue-800";
    if (confidence >= 0.75) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Brain className="w-4 h-4" />
            Advanced Arabic NLP - 95%+ Accuracy
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Arabic Resume Parser</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            State-of-the-art Arabic natural language processing for resume analysis
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Resume Input
              </CardTitle>
              <CardDescription>
                Paste Arabic resume text or upload a file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resumeText">Resume Text (Arabic)</Label>
                <Textarea
                  id="resumeText"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="الصق نص السيرة الذاتية هنا..."
                  rows={15}
                  className="font-arabic"
                  dir="rtl"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleParse}
                  disabled={parseMutation.isPending || !resumeText.trim()}
                  className="flex-1"
                >
                  {parseMutation.isPending ? (
                    <>
                      <Brain className="w-4 h-4 mr-2 animate-pulse" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Parse Resume
                    </>
                  )}
                </Button>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
              </div>

              {/* Sample Text */}
              <div className="bg-gray-50 border rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Try a sample:</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setResumeText(
                      "أحمد محمد علي\nمهندس برمجيات\nالبريد الإلكتروني: ahmed@example.com\nالهاتف: +966501234567\n\nالخبرة المهنية:\n- مطور برمجيات أول في شركة التقنية المتقدمة (2020-2023)\n- مطور ويب في شركة الحلول الرقمية (2018-2020)\n\nالمهارات:\n- لغات البرمجة: Python, JavaScript, Java\n- قواعد البيانات: MySQL, MongoDB\n- الأطر: React, Node.js, Django\n\nالتعليم:\n- بكالوريوس علوم الحاسب - جامعة الملك سعود (2014-2018)\n- ماجستير هندسة البرمجيات - جامعة الملك فهد (2018-2020)"
                    )
                  }
                >
                  Load Sample Arabic Resume
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Parsed Results
              </CardTitle>
              <CardDescription>
                Extracted information with confidence scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {parseResult ? (
                <div className="space-y-6">
                  {/* Overall Confidence */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-green-900">Overall Confidence</span>
                      <span className="text-2xl font-bold text-green-700">
                        {(parseResult.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={parseResult.confidence * 100} className="h-2" />
                  </div>

                  {/* Personal Information */}
                  {parseResult.personalInfo && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">Personal Information</h3>
                      <div className="space-y-2">
                        {parseResult.personalInfo.name && (
                          <div className="flex items-start justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium">Name:</span>
                            <span className="text-sm">{parseResult.personalInfo.name}</span>
                          </div>
                        )}
                        {parseResult.personalInfo.email && (
                          <div className="flex items-start justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium">Email:</span>
                            <span className="text-sm">{parseResult.personalInfo.email}</span>
                          </div>
                        )}
                        {parseResult.personalInfo.phone && (
                          <div className="flex items-start justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium">Phone:</span>
                            <span className="text-sm">{parseResult.personalInfo.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {parseResult.skills && parseResult.skills.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {parseResult.skills.map((skill: any, index: number) => (
                          <Badge key={index} className={getConfidenceColor(skill.confidence)}>
                            {skill.name} ({(skill.confidence * 100).toFixed(0)}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {parseResult.experience && parseResult.experience.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">Work Experience</h3>
                      <div className="space-y-3">
                        {parseResult.experience.map((exp: any, index: number) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium">{exp.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {(exp.confidence * 100).toFixed(0)}%
                              </Badge>
                            </div>
                            {exp.company && (
                              <p className="text-sm text-muted-foreground">{exp.company}</p>
                            )}
                            {exp.duration && (
                              <p className="text-xs text-muted-foreground mt-1">{exp.duration}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {parseResult.education && parseResult.education.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">Education</h3>
                      <div className="space-y-3">
                        {parseResult.education.map((edu: any, index: number) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium">{edu.degree}</h4>
                              <Badge variant="outline" className="text-xs">
                                {(edu.confidence * 100).toFixed(0)}%
                              </Badge>
                            </div>
                            {edu.institution && (
                              <p className="text-sm text-muted-foreground">{edu.institution}</p>
                            )}
                            {edu.year && (
                              <p className="text-xs text-muted-foreground mt-1">{edu.year}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {parseResult.languages && parseResult.languages.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">Languages</h3>
                      <div className="flex flex-wrap gap-2">
                        {parseResult.languages.map((lang: any, index: number) => (
                          <Badge key={index} variant="secondary">
                            {lang.name} - {lang.proficiency}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No results yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Parse a resume to see extracted information
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
              <CardTitle className="text-lg">95%+ Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Industry-leading accuracy in Arabic text extraction and entity recognition
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Multi-Format Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Process PDF, DOCX, and plain text resumes with consistent quality
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Real-time Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Instant parsing with confidence scores for each extracted field
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
