import { useParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CommunicationTimeline } from "@/components/CommunicationTimeline";
import { InterviewScheduler } from "@/components/InterviewScheduler";
import { User, Mail, Phone, MapPin, Calendar, FileText } from "lucide-react";

export default function CandidateProfile() {
  const { id } = useParams();
  const candidateId = parseInt(id || "0");
  const { user } = useAuth();
  const employerId = user?.id || 0;

  // Fetch candidate data (placeholder - you'll need to implement this query)
  const { data: candidate, isLoading } = trpc.candidates.getById.useQuery(
    { candidateId },
    { enabled: !!candidateId }
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading candidate profile...</div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Candidate not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{candidate.name}</h1>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                {candidate.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {candidate.email}
                  </div>
                )}
                {candidate.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {candidate.phone}
                  </div>
                )}
                {candidate.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {candidate.location}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Interview
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="timeline" className="space-y-6">
        <TabsList>
          <TabsTrigger value="timeline">Communication Timeline</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
          <TabsTrigger value="schedule">Schedule New Interview</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <CommunicationTimeline
            candidateId={candidateId}
            employerId={employerId}
          />
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Applications</CardTitle>
              <CardDescription>All job applications from this candidate</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Application history will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviews">
          <Card>
            <CardHeader>
              <CardTitle>Interview History</CardTitle>
              <CardDescription>Past and upcoming interviews</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Interview history will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <InterviewScheduler
            applicationId={0} // You'll need to pass the actual application ID
            employerId={employerId}
            candidateId={candidateId}
            jobId={0} // You'll need to pass the actual job ID
            onScheduled={() => {
              // Handle successful scheduling
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
