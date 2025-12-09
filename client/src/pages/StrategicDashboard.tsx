/**
 * Strategic Dashboard
 * Phase 60: Competitive Positioning Features Hub
 * - Global Job Search (Indeed/Glassdoor)
 * - Enhanced AI Matching Insights
 * - Predictive Recruitment Intelligence
 * - KSA Market Coaching
 * - Competitive Intelligence
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Globe, 
  Brain, 
  Target, 
  Award,
  Sparkles,
  BarChart3,
  Users,
  Zap
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function StrategicDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch competitive metrics
  const { data: competitiveMetrics, isLoading: metricsLoading } = 
    trpc.strategic.competitive.getCompetitiveMetrics.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
              <Sparkles className="h-10 w-10 text-blue-600" />
              Strategic Intelligence Platform
            </h1>
            <p className="text-slate-600 mt-2">
              Powered by 500+ strategic attributes • Competing with Recruit Holdings & Eightfold.ai
            </p>
          </div>
          <Badge variant="default" className="text-lg px-4 py-2">
            <Award className="h-5 w-5 mr-2" />
            Market Leader
          </Badge>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Match Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">92%</div>
              <p className="text-xs text-green-600 mt-1">+12% vs Recruit Holdings</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Time to Match</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">2 min</div>
              <p className="text-xs text-blue-600 mt-1">60% faster than competitors</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Retention Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">88%</div>
              <p className="text-xs text-purple-600 mt-1">+10% vs industry avg</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Cost Savings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">30%</div>
              <p className="text-xs text-orange-600 mt-1">Lower cost per quality hire</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-auto p-1">
            <TabsTrigger value="overview" className="flex items-center gap-2 py-3">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="global-jobs" className="flex items-center gap-2 py-3">
              <Globe className="h-4 w-4" />
              Global Jobs
            </TabsTrigger>
            <TabsTrigger value="ai-matching" className="flex items-center gap-2 py-3">
              <Brain className="h-4 w-4" />
              AI Matching
            </TabsTrigger>
            <TabsTrigger value="predictive" className="flex items-center gap-2 py-3">
              <Target className="h-4 w-4" />
              Predictive
            </TabsTrigger>
            <TabsTrigger value="competitive" className="flex items-center gap-2 py-3">
              <TrendingUp className="h-4 w-4" />
              Competitive
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    Strategic Advantages
                  </CardTitle>
                  <CardDescription>
                    What sets us apart from Recruit Holdings & Eightfold.ai
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Badge variant="secondary" className="mt-0.5">1</Badge>
                      <div>
                        <p className="font-medium">500+ Strategic Attribute Matching</p>
                        <p className="text-sm text-slate-600">3.3x more than Recruit Holdings</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="secondary" className="mt-0.5">2</Badge>
                      <div>
                        <p className="font-medium">Proprietary B2B SaaS Data</p>
                        <p className="text-sm text-slate-600">Predictive recruitment before job posting</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="secondary" className="mt-0.5">3</Badge>
                      <div>
                        <p className="font-medium">KSA Market-Specific Intelligence</p>
                        <p className="text-sm text-slate-600">Vision 2030 & Saudization focus</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="secondary" className="mt-0.5">4</Badge>
                      <div>
                        <p className="font-medium">Pay-for-Performance Model</p>
                        <p className="text-sm text-slate-600">ROI-focused pricing</p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-orange-600" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Access key strategic features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("global-jobs")}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Search Global Jobs (Indeed/Glassdoor)
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("ai-matching")}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Enhanced AI Matching Analysis
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("predictive")}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Predictive Hiring Insights
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("competitive")}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Competitive Intelligence
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Feature Highlights */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Capabilities</CardTitle>
                <CardDescription>
                  Comprehensive talent intelligence features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Global Job Access</h4>
                    <p className="text-sm text-blue-700">
                      Indeed & Glassdoor integration for worldwide opportunities with one-click apply
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">AI-Powered Matching</h4>
                    <p className="text-sm text-purple-700">
                      500+ attributes including soft skills, cultural fit, and retention prediction
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">KSA Market Expertise</h4>
                    <p className="text-sm text-green-700">
                      Vision 2030 alignment, Saudization guidance, and local market intelligence
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Global Jobs Tab */}
          <TabsContent value="global-jobs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-6 w-6 text-blue-600" />
                  Global Job Search
                </CardTitle>
                <CardDescription>
                  Search jobs from Indeed, Glassdoor, and our internal database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <Globe className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      Global Job Search Coming Soon
                    </h3>
                    <p className="text-blue-700 mb-4">
                      Integration with Indeed and Glassdoor APIs for worldwide job access
                    </p>
                    <Badge variant="secondary">Feature in Development</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Indeed Integration</h4>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>• Millions of global job listings</li>
                        <li>• One-click apply functionality</li>
                        <li>• Real-time job updates</li>
                        <li>• Company reviews and ratings</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Glassdoor Integration</h4>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>• Company culture insights</li>
                        <li>• Salary transparency</li>
                        <li>• Employee reviews</li>
                        <li>• Interview experiences</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Matching Tab */}
          <TabsContent value="ai-matching">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-6 w-6 text-purple-600" />
                  Enhanced AI Matching
                </CardTitle>
                <CardDescription>
                  500+ strategic attributes for superior candidate-job matching
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-6 bg-purple-50 border border-purple-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-purple-900 mb-4">
                      Strategic Attribute Categories
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-purple-800 mb-2">Soft Skills Analysis</h4>
                        <ul className="text-sm text-purple-700 space-y-1">
                          <li>• Communication & Leadership</li>
                          <li>• Teamwork & Collaboration</li>
                          <li>• Problem Solving & Creativity</li>
                          <li>• Adaptability & Critical Thinking</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-purple-800 mb-2">Emotional Intelligence</h4>
                        <ul className="text-sm text-purple-700 space-y-1">
                          <li>• Self-Awareness & Empathy</li>
                          <li>• Emotional Regulation</li>
                          <li>• Social Skills</li>
                          <li>• Motivation & Drive</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-purple-800 mb-2">Work Preferences</h4>
                        <ul className="text-sm text-purple-700 space-y-1">
                          <li>• Work Pace & Team Size</li>
                          <li>• Management Style Fit</li>
                          <li>• Communication Preferences</li>
                          <li>• Work-Life Balance Needs</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-purple-800 mb-2">Cultural Fit (KSA)</h4>
                        <ul className="text-sm text-purple-700 space-y-1">
                          <li>• Prayer Break Accommodation</li>
                          <li>• Halal Dining Requirements</li>
                          <li>• Gender Workspace Preferences</li>
                          <li>• Cultural Values Alignment</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Matching Dimensions</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Badge variant="outline">Technical Skills</Badge>
                      <Badge variant="outline">Soft Skills</Badge>
                      <Badge variant="outline">Cultural Fit</Badge>
                      <Badge variant="outline">Work Style</Badge>
                      <Badge variant="outline">Career Growth</Badge>
                      <Badge variant="outline">Retention Risk</Badge>
                      <Badge variant="outline">Wellbeing Match</Badge>
                      <Badge variant="outline">Team Dynamics</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Predictive Tab */}
          <TabsContent value="predictive">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-6 w-6 text-green-600" />
                  Predictive Recruitment Intelligence
                </CardTitle>
                <CardDescription>
                  Anticipate hiring needs before job postings using B2B SaaS data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-900 mb-4">
                      Proactive Hiring Intelligence
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-white rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">Workforce Trends</h4>
                        <p className="text-sm text-green-700">
                          Analyze shift data and employee skills to predict staffing needs
                        </p>
                      </div>
                      <div className="p-4 bg-white rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">Skill Gap Analysis</h4>
                        <p className="text-sm text-green-700">
                          Identify critical skill shortages before they impact operations
                        </p>
                      </div>
                      <div className="p-4 bg-white rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">Turnover Prediction</h4>
                        <p className="text-sm text-green-700">
                          Early warning system for retention risks and attrition patterns
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-semibold mb-3">Data Sources</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge>Shift Scheduler Data</Badge>
                      <Badge>Employee Skill Tracker</Badge>
                      <Badge>Operational Metrics</Badge>
                      <Badge>Retention Risk Scores</Badge>
                      <Badge>Staffing Gap Analysis</Badge>
                      <Badge>Seasonal Patterns</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Competitive Tab */}
          <TabsContent value="competitive">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                  Competitive Intelligence
                </CardTitle>
                <CardDescription>
                  How we compare to Recruit Holdings and Eightfold.ai
                </CardDescription>
              </CardHeader>
              <CardContent>
                {metricsLoading ? (
                  <div className="text-center py-8">Loading competitive metrics...</div>
                ) : (
                  <div className="space-y-6">
                    {competitiveMetrics?.metrics.map((metric, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{metric.name}</h4>
                            <Badge variant="secondary" className="mt-1">{metric.category}</Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">
                              {metric.oracle} {metric.unit}
                            </div>
                            <p className="text-xs text-slate-600">Our Performance</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-600">Recruit Holdings</p>
                            <p className="font-semibold">{metric.recruitHoldings} {metric.unit}</p>
                          </div>
                          <div>
                            <p className="text-slate-600">Eightfold.ai</p>
                            <p className="font-semibold">{metric.eightfold} {metric.unit}</p>
                          </div>
                          <div>
                            <p className="text-slate-600">Industry Avg</p>
                            <p className="font-semibold">{metric.industryAverage} {metric.unit}</p>
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-green-50 rounded">
                          <p className="text-sm text-green-800 font-medium">
                            ✓ {metric.advantage}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
