/**
 * KSA Market Coaching Page
 * Saudi Arabia-specific career guidance, Vision 2030 alignment, Saudization advice
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, TrendingUp, BookOpen, Target, Sparkles } from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function KSACoaching() {
  const { user } = useAuth();
  const [sessionType, setSessionType] = useState<string>("ksa_market_guidance");
  const [query, setQuery] = useState("");
  const [targetIndustry, setTargetIndustry] = useState("");
  const [targetRole, setTargetRole] = useState("");

  const getGuidanceMutation = trpc.strategic.ksaCoaching.getMarketGuidance.useMutation({
    onSuccess: () => {
      toast.success("KSA market guidance generated successfully");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const { data: skillMarketData } = trpc.strategic.ksaCoaching.getSkillMarketData.useQuery(
    { skillName: "Software Development" },
    { enabled: true }
  );

  const handleGetGuidance = () => {
    if (!query.trim()) {
      toast.error("Please enter your question");
      return;
    }

    // For demo, we need a candidateId - in production this would come from user's candidate profile
    getGuidanceMutation.mutate({
      candidateId: 1, // Demo value
      sessionType: sessionType as any,
      query,
      targetIndustry: targetIndustry || undefined,
      targetRole: targetRole || undefined,
    });
  };

  const sessionTypes = [
    { value: "ksa_market_guidance", label: "KSA Market Guidance", icon: MapPin },
    { value: "vision2030_alignment", label: "Vision 2030 Alignment", icon: Target },
    { value: "saudization_advice", label: "Saudization (Nitaqat) Advice", icon: TrendingUp },
    { value: "arabic_cv_optimization", label: "Arabic CV Optimization", icon: BookOpen },
    { value: "cultural_fit_coaching", label: "Cultural Fit Coaching", icon: Sparkles },
    { value: "salary_negotiation_ksa", label: "Salary Negotiation (KSA)", icon: TrendingUp },
    { value: "industry_specific_prep", label: "Industry-Specific Prep", icon: Target },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
            <MapPin className="h-10 w-10 text-green-600" />
            KSA Market Coaching
          </h1>
          <p className="text-slate-600 mt-2">
            Saudi Arabia-specific career guidance • Vision 2030 alignment • Saudization expertise
          </p>
        </div>

        {/* Market Overview */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle>Saudi Arabia Labor Market Insights</CardTitle>
            <CardDescription>
              Real-time market intelligence for the KSA job market
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Vision 2030 Sectors</h4>
                <div className="space-y-1">
                  <Badge variant="secondary">Technology</Badge>
                  <Badge variant="secondary">Tourism</Badge>
                  <Badge variant="secondary">Entertainment</Badge>
                  <Badge variant="secondary">Renewable Energy</Badge>
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">High-Demand Skills</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Software Development</li>
                  <li>• Data Analytics</li>
                  <li>• Project Management</li>
                  <li>• Digital Marketing</li>
                </ul>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">Saudization Priority</h4>
                <p className="text-sm text-purple-700 mb-2">
                  Nitaqat program requires minimum Saudi employee percentages
                </p>
                <Badge variant="default">High Priority</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coaching Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>Get Personalized Guidance</CardTitle>
              <CardDescription>
                Ask questions about the KSA job market, career paths, or cultural fit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sessionType">Coaching Topic</Label>
                <Select value={sessionType} onValueChange={setSessionType}>
                  <SelectTrigger id="sessionType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sessionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="targetIndustry">Target Industry (Optional)</Label>
                <Select value={targetIndustry} onValueChange={setTargetIndustry}>
                  <SelectTrigger id="targetIndustry">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="finance">Finance & Banking</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="oil_gas">Oil & Gas</SelectItem>
                    <SelectItem value="tourism">Tourism & Hospitality</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="targetRole">Target Role (Optional)</Label>
                <input
                  id="targetRole"
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <Label htmlFor="query">Your Question</Label>
                <Textarea
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask about salary expectations, cultural fit, required skills, Saudization requirements, or career paths in Saudi Arabia..."
                  rows={5}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={handleGetGuidance}
                disabled={getGuidanceMutation.isPending}
                className="w-full"
              >
                {getGuidanceMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Guidance...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get KSA Market Guidance
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Response Section */}
          <Card>
            <CardHeader>
              <CardTitle>AI Guidance Response</CardTitle>
              <CardDescription>
                Expert insights tailored to the Saudi market
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getGuidanceMutation.data ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg max-h-96 overflow-y-auto">
                    <Streamdown>{getGuidanceMutation.data.guidance}</Streamdown>
                  </div>

                  {/* Market Insights */}
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Market Insights</h4>
                    <div className="text-sm text-green-800 space-y-1">
                      <p>
                        <strong>Salary Range:</strong> {getGuidanceMutation.data.marketInsights.averageSalaryRange}
                      </p>
                      <p>
                        <strong>Demand Level:</strong> {getGuidanceMutation.data.marketInsights.demandLevel}
                      </p>
                      <p>
                        <strong>Saudization Priority:</strong>{" "}
                        {getGuidanceMutation.data.marketInsights.saudizationPriority ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>

                  {/* Skill Gaps */}
                  {getGuidanceMutation.data.skillGaps.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Identified Skill Gaps</h4>
                      <div className="flex flex-wrap gap-2">
                        {getGuidanceMutation.data.skillGaps.map((skill, index) => (
                          <Badge key={index} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Courses */}
                  {getGuidanceMutation.data.recommendedCourses.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Recommended Upskilling</h4>
                      <ul className="text-sm space-y-1">
                        {getGuidanceMutation.data.recommendedCourses.map((course, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <BookOpen className="h-4 w-4 mt-0.5 text-blue-600" />
                            {course}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Items */}
                  {getGuidanceMutation.data.actionItems.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Next Steps</h4>
                      <ul className="text-sm space-y-1">
                        {getGuidanceMutation.data.actionItems.map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Target className="h-4 w-4 mt-0.5 text-green-600" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                  <p>Ask a question to receive personalized KSA market guidance</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sample Market Data */}
        {skillMarketData && (
          <Card>
            <CardHeader>
              <CardTitle>Sample: Software Development Market Data (KSA)</CardTitle>
              <CardDescription>
                Real-time intelligence for specific skills in Saudi Arabia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Demand Level</h4>
                  <Badge variant="default" className="text-lg">
                    {skillMarketData.demandLevel.toUpperCase()}
                  </Badge>
                  <p className="text-xs text-blue-700 mt-1">Trend: {skillMarketData.demandTrend}</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="text-sm font-medium text-green-900 mb-1">Average Salary</h4>
                  <p className="text-2xl font-bold text-green-900">
                    {skillMarketData.salaryData.average.toLocaleString()} {skillMarketData.salaryData.currency}
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Range: {skillMarketData.salaryData.min.toLocaleString()} -{" "}
                    {skillMarketData.salaryData.max.toLocaleString()}
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-900 mb-1">Talent Gap</h4>
                  <p className="text-2xl font-bold text-purple-900">{skillMarketData.talentGap.gapPercentage}%</p>
                  <p className="text-xs text-purple-700 mt-1">
                    Demand: {skillMarketData.talentGap.demand} | Available: {skillMarketData.talentGap.availableTalent}
                  </p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="text-sm font-medium text-orange-900 mb-1">Vision 2030</h4>
                  <Badge variant={skillMarketData.vision2030Alignment ? "default" : "secondary"}>
                    {skillMarketData.vision2030Alignment ? "Aligned" : "Not Aligned"}
                  </Badge>
                  <p className="text-xs text-orange-700 mt-2">
                    Saudization: {skillMarketData.saudizationPriority ? "High Priority" : "Standard"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
