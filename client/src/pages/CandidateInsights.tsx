import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CultureFitRadarChart } from "@/components/CultureFitRadarChart";
import { WellbeingCompatibilityScore } from "@/components/WellbeingCompatibilityScore";
import { Badge } from "@/components/ui/badge";
import { Brain, Heart, TrendingUp, Users } from "lucide-react";

export default function CandidateInsights() {
  // Mock candidate culture fit data
  const candidateScores = {
    hierarchy: 65,
    innovation: 85,
    teamStyle: 75,
    communication: 80,
    workLifeBalance: 90,
    riskTolerance: 70,
    decisionMaking: 75,
    feedback: 85,
  };

  // Mock company culture data
  const companyScores = {
    hierarchy: 70,
    innovation: 80,
    teamStyle: 70,
    communication: 85,
    workLifeBalance: 85,
    riskTolerance: 65,
    decisionMaking: 70,
    feedback: 80,
  };

  // Mock wellbeing data
  const wellbeingScore = {
    overall: 78,
    factors: {
      workLifeBalance: 85,
      stressManagement: 72,
      growthMindset: 88,
      autonomy: 75,
      socialConnection: 80,
      purposeAlignment: 82,
      energyLevel: 70,
      emotionalSafety: 76,
    },
    burnoutRisk: 35,
    recommendations: [
      "Maintain current work-life balance practices",
      "Consider stress management workshops",
      "Encourage peer mentoring for growth mindset development",
    ],
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Brain className="h-8 w-8 text-primary" />
          Candidate AI Insights
        </h1>
        <p className="text-muted-foreground">
          AI-powered culture fit analysis and wellbeing compatibility assessment
        </p>
      </div>

      {/* Candidate Profile Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sarah Johnson</CardTitle>
              <CardDescription>Senior Software Engineer • 8 years experience</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-green-500 hover:bg-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                85% Overall Match
              </Badge>
              <Badge className="bg-blue-500 hover:bg-blue-600">
                <Users className="h-3 w-3 mr-1" />
                Culture Fit: 78%
              </Badge>
              <Badge className="bg-pink-500 hover:bg-pink-600">
                <Heart className="h-3 w-3 mr-1" />
                Wellbeing: 78%
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Insights Tabs */}
      <Tabs defaultValue="culture" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="culture">Culture Fit Analysis</TabsTrigger>
          <TabsTrigger value="wellbeing">Wellbeing Assessment</TabsTrigger>
          <TabsTrigger value="combined">Combined View</TabsTrigger>
        </TabsList>

        <TabsContent value="culture" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Culture Fit Radar Chart</CardTitle>
              <CardDescription>
                Comparison of candidate preferences vs. company culture across 8 dimensions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CultureFitRadarChart
                candidateScores={candidateScores}
                companyScores={companyScores}
                height={400}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Strong Alignments</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span><strong>Innovation:</strong> Both value creative problem-solving and new approaches (85% vs 80%)</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span><strong>Work-Life Balance:</strong> Excellent alignment on flexible work arrangements (90% vs 85%)</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span><strong>Communication:</strong> Strong match in communication style preferences (80% vs 85%)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Areas to Discuss</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-yellow-500 mt-0.5">!</span>
                    <span><strong>Risk Tolerance:</strong> Candidate slightly more risk-averse than company culture (70% vs 65%)</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-yellow-500 mt-0.5">!</span>
                    <span><strong>Hierarchy:</strong> Minor difference in preference for organizational structure (65% vs 70%)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="wellbeing" className="space-y-6">
          <WellbeingCompatibilityScore score={wellbeingScore} />

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Top Strength</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">Growth Mindset</p>
                <p className="text-sm text-muted-foreground mt-1">88% - Excellent learning orientation</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Focus Area</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-600">Energy Level</p>
                <p className="text-sm text-muted-foreground mt-1">70% - Monitor for signs of fatigue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Burnout Risk</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">Low</p>
                <p className="text-sm text-muted-foreground mt-1">35% - Healthy wellbeing indicators</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="combined" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Culture Fit Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <CultureFitRadarChart
                  candidateScores={candidateScores}
                  companyScores={companyScores}
                  height={300}
                />
              </CardContent>
            </Card>

            <WellbeingCompatibilityScore score={wellbeingScore} compact={false} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Hiring Recommendation</CardTitle>
              <CardDescription>Based on culture fit and wellbeing analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500 hover:bg-green-600 text-lg px-4 py-2">
                  Recommended for Hire
                </Badge>
                <span className="text-muted-foreground">85% overall compatibility</span>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Key Highlights:</h4>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>Strong cultural alignment in innovation, communication, and work-life balance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>Excellent wellbeing indicators with low burnout risk (35%)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>High growth mindset (88%) aligns with company's learning culture</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Minor differences in hierarchy and risk tolerance can be addressed during onboarding</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">Interview Focus Areas:</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Innovation approach</Badge>
                  <Badge variant="outline">Team collaboration style</Badge>
                  <Badge variant="outline">Work-life balance expectations</Badge>
                  <Badge variant="outline">Stress management strategies</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
