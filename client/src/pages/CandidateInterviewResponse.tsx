import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Video, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CandidateInterviewResponse() {
  const [, params] = useRoute('/interview/respond/:token');
  const token = params?.token || '';
  
  const [responding, setResponding] = useState(false);
  const [response, setResponse] = useState<'accept' | 'decline' | null>(null);

  // Mock interview data - in production, fetch from backend using token
  const interview = {
    id: 1,
    jobTitle: 'Senior Software Engineer',
    companyName: 'Tech Corp',
    scheduledAt: new Date(Date.now() + 86400000 * 3), // 3 days from now
    duration: 60,
    interviewType: 'video' as const,
    location: 'https://meet.google.com/abc-defg-hij',
    interviewerName: 'Sarah Johnson',
    interviewerTitle: 'Engineering Manager',
  };

  const handleResponse = async (accepted: boolean) => {
    setResponding(true);
    try {
      // In production, call API to record response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setResponse(accepted ? 'accept' : 'decline');
      toast.success(
        accepted 
          ? 'Interview accepted! Calendar invite sent to your email.'
          : 'Interview declined. We\'ll notify the employer.'
      );
    } catch (error) {
      toast.error('Failed to submit response. Please try again.');
    } finally {
      setResponding(false);
    }
  };

  if (response) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            {response === 'accept' ? (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-2xl">Interview Confirmed!</CardTitle>
                <CardDescription>
                  We've sent a calendar invite to your email. See you on {interview.scheduledAt.toLocaleDateString()}!
                </CardDescription>
              </>
            ) : (
              <>
                <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <CardTitle className="text-2xl">Interview Declined</CardTitle>
                <CardDescription>
                  Thank you for letting us know. We've notified the employer.
                </CardDescription>
              </>
            )}
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">Interview Invitation</CardTitle>
          <CardDescription className="text-base">
            You've been invited to interview for {interview.jobTitle} at {interview.companyName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Interview Details */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium">Date & Time</p>
                <p className="text-sm text-muted-foreground">
                  {interview.scheduledAt.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {interview.scheduledAt.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium">Duration</p>
                <p className="text-sm text-muted-foreground">{interview.duration} minutes</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              {interview.interviewType === 'video' ? (
                <Video className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
              ) : (
                <MapPin className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium">
                  {interview.interviewType === 'video' ? 'Video Call' : 'Location'}
                </p>
                <p className="text-sm text-muted-foreground break-all">{interview.location}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-1 flex-shrink-0">
                {interview.interviewerName.charAt(0)}
              </div>
              <div>
                <p className="font-medium">{interview.interviewerName}</p>
                <p className="text-sm text-muted-foreground">{interview.interviewerTitle}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={() => handleResponse(true)}
              disabled={responding}
              className="flex-1"
              size="lg"
            >
              {responding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept Interview
                </>
              )}
            </Button>
            <Button
              onClick={() => handleResponse(false)}
              disabled={responding}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Decline
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            By accepting, you agree to attend the interview at the scheduled time.
            If you need to reschedule, please contact the employer directly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
