import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import CultureFitRadar from "@/components/CultureFitRadar";
import WellbeingScore from "@/components/WellbeingScore";
import MatchTimeline from "@/components/MatchTimeline";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar, 
  FileText,
  TrendingUp,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { Progress } from "@/components/ui/progress";

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const candidateId = parseInt(id || "0");

  const { data: candidate, isLoading: candidateLoading } = trpc.candidates.getById.useQuery(
    { candidateId },
    { enabled: !!candidateId }
  );

  const { data: applications = [], isLoading: applicationsLoading } = trpc.applications.getByCandidateId.useQuery(
    { candidateId },
    { enabled: !!candidateId }
  );

  const { data: interviews = [], isLoading: interviewsLoading } = trpc.interviews.getByCandidateId.useQuery(
    { candidateId },
    { enabled: !!candidateId }
  );

  if (candidateLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Candidate not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-500/10 text-blue-700 border-blue-300";
      case "screening":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-300";
      case "interviewing":
        return "bg-purple-500/10 text-purple-700 border-purple-300";
      case "offered":
        return "bg-green-500/10 text-green-700 border-green-300";
      case "rejected":
        return "bg-red-500/10 text-red-700 border-red-300";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-300";
    }
  };

  const getInterviewStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "scheduled":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/candidates")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{candidate.fullName}</h1>
          {candidate.headline && (
            <p className="text-muted-foreground mt-1">{candidate.headline}</p>
          )}
        </div>
        <Badge variant="outline" className={
          candidate.isAvailable ? "bg-green-500/10 text-green-700 border-green-300" : "bg-gray-500/10 text-gray-700 border-gray-300"
        }>
          {candidate.isAvailable ? "Available" : "Not Available"}
        </Badge>
      </div>

      {/* Contact Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {candidate.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${candidate.email}`} className="text-sm hover:underline">
                  {candidate.email}
                </a>
              </div>
            )}
            {candidate.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{candidate.phone}</span>
              </div>
            )}
            {candidate.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{candidate.location}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">Applications ({applications.length})</TabsTrigger>
          <TabsTrigger value="interviews">Interviews ({interviews.length})</TabsTrigger>
          <TabsTrigger value="skills">Skills & Matching</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Profile Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {candidate.yearsOfExperience !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Experience</span>
                    <span className="font-medium">{candidate.yearsOfExperience} years</span>
                  </div>
                )}
                {candidate.preferredWorkSetting && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Work Setting</span>
                    <Badge variant="secondary">{candidate.preferredWorkSetting}</Badge>
                  </div>
                )}
                {candidate.willingToRelocate !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Willing to Relocate</span>
                    <span className="font-medium">{candidate.willingToRelocate ? "Yes" : "No"}</span>
                  </div>
                )}
                {(candidate.desiredSalaryMin || candidate.desiredSalaryMax) && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Desired Salary</span>
                    <span className="font-medium">
                      ${candidate.desiredSalaryMin?.toLocaleString()} - ${candidate.desiredSalaryMax?.toLocaleString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Profile Score */}
            {candidate.aiProfileScore !== null && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Profile Score</CardTitle>
                  <CardDescription>Overall profile quality assessment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{candidate.aiProfileScore}/100</span>
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <Progress value={candidate.aiProfileScore} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary */}
          {candidate.summary && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{candidate.summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Resume */}
          {candidate.resumeUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Resume</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4 mr-2" />
                    View Resume
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-4">
          {/* Match Timeline - Show for all applications */}
          {applications.length > 0 && applications[0].jobId && (
            <MatchTimeline candidateId={candidateId} jobId={applications[0].jobId} />
          )}

          {applicationsLoading ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Loading applications...</p>
              </CardContent>
            </Card>
          ) : applications.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No applications found</p>
              </CardContent>
            </Card>
          ) : (
            applications.map((application: any) => (
              <Card key={application.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{application.job?.title || "Unknown Position"}</CardTitle>
                      <CardDescription>
                        Applied on {new Date(application.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={getStatusColor(application.status)}>
                      {application.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Match Scores */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {application.overallMatchScore !== null && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Overall Match</p>
                        <div className="flex items-center gap-2">
                          <Progress value={application.overallMatchScore} className="h-2 flex-1" />
                          <span className="text-sm font-medium">{application.overallMatchScore}%</span>
                        </div>
                      </div>
                    )}
                    {application.skillMatchScore !== null && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Skills</p>
                        <div className="flex items-center gap-2">
                          <Progress value={application.skillMatchScore} className="h-2 flex-1" />
                          <span className="text-sm font-medium">{application.skillMatchScore}%</span>
                        </div>
                      </div>
                    )}
                    {application.cultureFitScore !== null && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Culture Fit</p>
                        <div className="flex items-center gap-2">
                          <Progress value={application.cultureFitScore} className="h-2 flex-1" />
                          <span className="text-sm font-medium">{application.cultureFitScore}%</span>
                        </div>
                      </div>
                    )}
                    {application.wellbeingMatchScore !== null && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Wellbeing</p>
                        <div className="flex items-center gap-2">
                          <Progress value={application.wellbeingMatchScore} className="h-2 flex-1" />
                          <span className="text-sm font-medium">{application.wellbeingMatchScore}%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cover Letter */}
                  {application.coverLetter && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium mb-2">Cover Letter</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {application.coverLetter}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Interviews Tab */}
        <TabsContent value="interviews" className="space-y-4">
          {interviewsLoading ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Loading interviews...</p>
              </CardContent>
            </Card>
          ) : interviews.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No interviews scheduled</p>
              </CardContent>
            </Card>
          ) : (
            interviews.map((interview: any) => (
              <Card key={interview.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getInterviewStatusIcon(interview.status)}
                        {interview.job?.title || "Unknown Position"}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(interview.scheduledAt).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{interview.interviewType}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{interview.duration} minutes</span>
                  </div>
                  {interview.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{interview.location}</span>
                    </div>
                  )}
                  {interview.notes && (
                    <>
                      <Separator className="my-2" />
                      <div>
                        <p className="text-sm font-medium mb-1">Notes</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {interview.notes}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Skills & Matching Tab */}
        <TabsContent value="skills" className="space-y-4">
          {/* Culture Fit & Wellbeing Analysis */}
          {applications.length > 0 && applications[0].cultureMatchScore !== null && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Culture Fit Radar */}
              {applications[0].candidateCultureProfile && applications[0].companyCultureProfile && (
                <CultureFitRadar
                  candidateProfile={applications[0].candidateCultureProfile as any}
                  companyProfile={applications[0].companyCultureProfile as any}
                  matchScore={applications[0].cultureMatchScore || 0}
                />
              )}
              {/* Wellbeing Score */}
              {applications[0].candidateWellbeingProfile && applications[0].wellbeingMatchScore !== null && (
                <WellbeingScore
                  score={applications[0].wellbeingMatchScore || 0}
                  burnoutRisk={applications[0].burnoutRisk || 0}
                  factors={applications[0].candidateWellbeingProfile as any}
                  gaps={applications[0].wellbeingGaps ? JSON.parse(applications[0].wellbeingGaps as string) : []}
                />
              )}
            </div>
          )}

          {/* Technical Skills */}
          {candidate.technicalSkills && candidate.technicalSkills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Technical Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {candidate.technicalSkills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Soft Skills */}
          {candidate.softSkills && candidate.softSkills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Soft Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {candidate.softSkills.map((skill, index) => (
                    <Badge key={index} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Inferred Attributes */}
          {candidate.aiInferredAttributes && (
            <Card>
              <CardHeader>
                <CardTitle>AI-Inferred Attributes</CardTitle>
                <CardDescription>Attributes automatically detected from profile analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
                  {JSON.stringify(candidate.aiInferredAttributes, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Match Breakdown from Latest Application */}
          {applications.length > 0 && applications[0].matchBreakdown && (
            <Card>
              <CardHeader>
                <CardTitle>Latest Match Breakdown</CardTitle>
                <CardDescription>Detailed matching analysis for most recent application</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
                  {JSON.stringify(applications[0].matchBreakdown, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
