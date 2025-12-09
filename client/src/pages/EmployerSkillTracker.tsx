import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Award, Plus, Trash2, Users, TrendingUp, AlertTriangle, Target } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function EmployerSkillTracker() {
  const [, setLocation] = useLocation();
  const [employeeName, setEmployeeName] = useState("");
  const [skillName, setSkillName] = useState("");
  const [proficiencyLevel, setProficiencyLevel] = useState<string>("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");

  const { data: skills, refetch } = trpc.saas.getEmployeeSkills.useQuery();
  const createSkill = trpc.saas.createEmployeeSkill.useMutation({
    onSuccess: () => {
      toast.success("Skill recorded successfully");
      setEmployeeName("");
      setSkillName("");
      setProficiencyLevel("");
      setYearsOfExperience("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to record skill");
    }
  });

  const deleteSkill = trpc.saas.deleteEmployeeSkill.useMutation({
    onSuccess: () => {
      toast.success("Skill deleted");
      refetch();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName || !skillName || !proficiencyLevel) {
      toast.error("Please fill all required fields");
      return;
    }

    createSkill.mutate({
      employeeName,
      skillName,
      proficiencyLevel,
      yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : undefined
    });
  };

  // Calculate skill insights
  const insights = skills ? {
    totalSkills: skills.length,
    uniqueEmployees: new Set(skills.map((s: any) => s.employeeName)).size,
    skillDistribution: skills.reduce((acc: any, skill: any) => {
      acc[skill.skillName] = (acc[skill.skillName] || 0) + 1;
      return acc;
    }, {}),
    proficiencyBreakdown: skills.reduce((acc: any, skill: any) => {
      acc[skill.proficiencyLevel] = (acc[skill.proficiencyLevel] || 0) + 1;
      return acc;
    }, {}),
    topSkills: Object.entries(
      skills.reduce((acc: any, skill: any) => {
        acc[skill.skillName] = (acc[skill.skillName] || 0) + 1;
        return acc;
      }, {})
    ).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5)
  } : null;

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case "expert": return "bg-green-100 text-green-700";
      case "advanced": return "bg-blue-100 text-blue-700";
      case "intermediate": return "bg-yellow-100 text-yellow-700";
      case "beginner": return "bg-orange-100 text-orange-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setLocation("/employer/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Award className="h-6 w-6 text-purple-600" />
                Employee Skill Tracker
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Strategic Value Banner */}
        <Card className="mb-8 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-2">Predictive Skill Gap Analysis</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Track your team's skills to unlock powerful insights. Our AI analyzes your workforce capabilities to identify
                  skill gaps, predict future needs, and <strong className="text-purple-700">proactively match you with candidates</strong> who fill those gaps—before you even realize you need them.
                </p>
                <div className="grid md:grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-purple-600 rounded-full"></div>
                    <span className="text-slate-700">Real-time skill gap detection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-pink-600 rounded-full"></div>
                    <span className="text-slate-700">Future capability forecasting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-blue-600 rounded-full"></div>
                    <span className="text-slate-700">Pre-matched candidate pipeline</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Add Skill Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-purple-600" />
                  Record Employee Skill
                </CardTitle>
                <CardDescription>
                  Track skills to identify capability gaps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="employeeName">Employee Name</Label>
                    <Input
                      id="employeeName"
                      value={employeeName}
                      onChange={(e) => setEmployeeName(e.target.value)}
                      placeholder="Jane Smith"
                    />
                  </div>

                  <div>
                    <Label htmlFor="skillName">Skill Name</Label>
                    <Input
                      id="skillName"
                      value={skillName}
                      onChange={(e) => setSkillName(e.target.value)}
                      placeholder="e.g., Python, Project Management, Sales"
                    />
                  </div>

                  <div>
                    <Label htmlFor="proficiencyLevel">Proficiency Level</Label>
                    <Select value={proficiencyLevel} onValueChange={setProficiencyLevel}>
                      <SelectTrigger id="proficiencyLevel">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="yearsOfExperience">Years of Experience (Optional)</Label>
                    <Input
                      id="yearsOfExperience"
                      type="number"
                      min="0"
                      value={yearsOfExperience}
                      onChange={(e) => setYearsOfExperience(e.target.value)}
                      placeholder="e.g., 3"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={createSkill.isPending}>
                    {createSkill.isPending ? "Recording..." : "Record Skill"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Insights Card */}
            {insights && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-base">Skill Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Total Skills Tracked</span>
                    <span className="font-semibold text-slate-900">{insights.totalSkills}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Employees Tracked</span>
                    <span className="font-semibold text-slate-900">{insights.uniqueEmployees}</span>
                  </div>
                  
                  {insights.topSkills.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-sm font-semibold text-slate-900 mb-2">Top Skills</p>
                      {insights.topSkills.map(([skill, count]) => (
                        <div key={skill} className="flex justify-between items-center text-sm mb-1">
                          <span className="text-slate-600">{skill}</span>
                          <span className="text-slate-900">{count as number} employees</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {Object.keys(insights.proficiencyBreakdown).length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-sm font-semibold text-slate-900 mb-2">Proficiency Levels</p>
                      {Object.entries(insights.proficiencyBreakdown).map(([level, count]) => (
                        <div key={level} className="flex justify-between items-center text-sm mb-1">
                          <span className="text-slate-600 capitalize">{level}</span>
                          <span className="text-slate-900">{count as number}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Skills List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  Tracked Skills
                </CardTitle>
                <CardDescription>
                  View and manage employee skill inventory
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!skills || skills.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No skills tracked yet</h3>
                    <p className="text-slate-600">
                      Start recording employee skills to unlock AI-powered skill gap analysis
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {skills.map((skill: any) => (
                      <Card key={skill.id} className="border-slate-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                                  <Users className="h-5 w-5 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-900">{skill.employeeName}</p>
                                  <p className="text-sm text-slate-600">{skill.skillName}</p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 ml-13">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getProficiencyColor(skill.proficiencyLevel)}`}>
                                  {skill.proficiencyLevel}
                                </span>
                                {skill.yearsOfExperience && (
                                  <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                                    {skill.yearsOfExperience} {skill.yearsOfExperience === 1 ? 'year' : 'years'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteSkill.mutate({ id: skill.id })}
                              disabled={deleteSkill.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Prediction Notice */}
            {skills && skills.length >= 10 && (
              <Card className="mt-6 border-purple-200 bg-purple-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1">AI Skill Gap Analysis Active</h3>
                      <p className="text-sm text-slate-600 mb-3">
                        With {skills.length} skills tracked across {insights?.uniqueEmployees} employees, our AI can now:
                      </p>
                      <ul className="text-sm text-slate-700 space-y-1">
                        <li>• Identify critical skill gaps in your workforce</li>
                        <li>• Predict future capability needs based on industry trends</li>
                        <li>• Recommend training priorities for existing staff</li>
                        <li>• Pre-match candidates who fill identified gaps</li>
                      </ul>
                      <Button size="sm" className="mt-4" onClick={() => setLocation("/employer/dashboard")}>
                        View Skill Gap Analysis
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
