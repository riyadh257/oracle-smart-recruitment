import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Eye, Clock, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function PresentationAnalytics() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const presentationId = parseInt(id || "0");
  const { data: presentation, isLoading: loadingPresentation } = trpc.presentation.getById.useQuery(
    { id: presentationId },
    { enabled: !!presentationId }
  );

  const { data: analytics, isLoading: loadingAnalytics } = trpc.presentation.getAnalytics.useQuery(
    { presentationId },
    { enabled: !!presentationId }
  );

  const isLoading = loadingPresentation || loadingAnalytics;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!presentation) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Presentation not found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setLocation("/presentations")}
            >
              Back to Presentations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const slideData = analytics?.slideAnalytics.map((slide) => ({
    name: `Slide ${slide.slideIndex + 1}`,
    views: slide.viewCount,
    avgTime: Math.round(slide.avgTimeSpent),
  })) || [];

  const totalViews = slideData.reduce((sum: any, slide: any) => sum + slide.views, 0);
  const avgTimePerSlide = slideData.length > 0
    ? Math.round(slideData.reduce((sum: any, slide: any) => sum + slide.avgTime, 0) / slideData.length)
    : 0;

  const mostViewedSlide = slideData.length > 0
    ? slideData.reduce((max: any, slide: any) => (slide.views > max.views ? slide : max))
    : null;

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => setLocation("/presentations")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Presentations
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">{presentation.title}</h1>
        <p className="text-muted-foreground mt-2">Presentation Analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Viewers</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.uniqueViewers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total unique sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Slide Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
            <p className="text-xs text-muted-foreground">
              Across all slides
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time Per Slide</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgTimePerSlide}s</div>
            <p className="text-xs text-muted-foreground">
              Average engagement time
            </p>
          </CardContent>
        </Card>
      </div>

      {mostViewedSlide && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Most Viewed Slide</CardTitle>
            <CardDescription>
              {mostViewedSlide.name} with {mostViewedSlide.views} views
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Slide Views</CardTitle>
          <CardDescription>
            Number of views per slide
          </CardDescription>
        </CardHeader>
        <CardContent>
          {slideData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={slideData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              No analytics data available yet
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Average Time Spent</CardTitle>
          <CardDescription>
            Average time viewers spend on each slide (in seconds)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {slideData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={slideData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgTime" fill="hsl(var(--chart-2))" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              No analytics data available yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
