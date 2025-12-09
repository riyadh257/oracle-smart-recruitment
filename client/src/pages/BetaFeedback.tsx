import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MessageSquare, Star, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function BetaFeedback() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    title: "",
    description: "",
    priority: "medium",
    rating: 0,
  });

  // Assuming signupId is stored in user profile or fetched separately
  const signupId = 1; // This should come from user context or API

  const { data: feedbackList, refetch } = trpc.betaProgram.getFeedbackBySignup.useQuery(
    { signupId },
    { enabled: !!user }
  );

  const submitMutation = trpc.betaProgram.submitFeedback.useMutation({
    onSuccess: () => {
      toast.success("Feedback submitted successfully!");
      setShowForm(false);
      setFormData({
        category: "",
        title: "",
        description: "",
        priority: "medium",
        rating: 0,
      });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit feedback");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category || !formData.title || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    submitMutation.mutate({
      signupId,
      category: formData.category as any,
      title: formData.title,
      description: formData.description,
      priority: formData.priority as any,
      rating: formData.rating || undefined,
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "bug":
        return "bg-red-100 text-red-800";
      case "feature_request":
        return "bg-blue-100 text-blue-800";
      case "usability":
        return "bg-purple-100 text-purple-800";
      case "performance":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "new":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Beta Feedback</h1>
            <p className="text-gray-600">Share your experience and help us improve</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Submit Feedback"}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>New Feedback</CardTitle>
              <CardDescription>
                Tell us about bugs, feature requests, or general feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category">
                      Category <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bug">Bug Report</SelectItem>
                        <SelectItem value="feature_request">Feature Request</SelectItem>
                        <SelectItem value="usability">Usability Issue</SelectItem>
                        <SelectItem value="performance">Performance Issue</SelectItem>
                        <SelectItem value="general">General Feedback</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Brief description of the issue or suggestion"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Provide detailed information..."
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Overall Rating (Optional)</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, rating }))}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            rating <= formData.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <Button type="submit" disabled={submitMutation.isPending} className="w-full">
                  {submitMutation.isPending ? "Submitting..." : "Submit Feedback"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Feedback List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Your Feedback History</h2>

          {feedbackList && feedbackList.length > 0 ? (
            feedbackList.map((feedback: any) => (
              <Card key={feedback.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getCategoryColor(feedback.category)}>
                          {feedback.category.replace("_", " ")}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getStatusIcon(feedback.status)}
                          {feedback.status.replace("_", " ")}
                        </Badge>
                        {feedback.priority && (
                          <Badge
                            variant={
                              feedback.priority === "critical" || feedback.priority === "high"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {feedback.priority}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{feedback.title}</CardTitle>
                      <CardDescription className="mt-1">
                        Submitted on {new Date(feedback.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {feedback.rating && (
                      <div className="flex gap-1">
                        {Array.from({ length: feedback.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{feedback.description}</p>

                  {feedback.adminResponse && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-900">Team Response</span>
                        <span className="text-xs text-blue-600">
                          {new Date(feedback.respondedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-blue-800">{feedback.adminResponse}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No feedback submitted yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Click "Submit Feedback" to share your thoughts
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
