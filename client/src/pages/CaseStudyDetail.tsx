import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  TrendingUp,
  Clock,
  Target,
  CheckCircle2,
  Quote
} from "lucide-react";

export default function CaseStudyDetail() {
  const params = useParams();
  const slug = params.slug || "";
  const [, setLocation] = useLocation();

  const { data: caseStudy, isLoading } = trpc.caseStudies.getBySlug.useQuery({ slug });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Skeleton className="h-96 w-full" />
        <div className="container mx-auto py-12">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!caseStudy) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Case Study Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The case study you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => setLocation("/case-studies")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Case Studies
        </Button>
      </div>
    );
  }

  const formatMetric = (value: number | null, suffix: string = "%") => {
    if (!value) return null;
    return `${value}${suffix}`;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-96 bg-gradient-to-br from-primary to-primary/80">
        {caseStudy.coverImage && (
          <div className="absolute inset-0">
            <img
              src={caseStudy.coverImage}
              alt={caseStudy.title}
              className="w-full h-full object-cover opacity-20"
            />
          </div>
        )}
        <div className="relative container mx-auto h-full flex flex-col justify-center text-white">
          <Button
            variant="ghost"
            className="w-fit mb-4 text-white hover:bg-white/20"
            onClick={() => setLocation("/case-studies")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Case Studies
          </Button>
          
          {caseStudy.customerLogo && (
            <img
              src={caseStudy.customerLogo}
              alt={caseStudy.customerName}
              className="h-16 w-auto mb-6 object-contain brightness-0 invert"
            />
          )}
          
          <h1 className="text-5xl font-bold mb-4">{caseStudy.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-white/90">
            {caseStudy.industry && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>{caseStudy.industry}</span>
              </div>
            )}
            {caseStudy.companySize && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{caseStudy.companySize} employees</span>
              </div>
            )}
            {caseStudy.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{caseStudy.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Challenge */}
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                    <Target className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold">The Challenge</h2>
                </div>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {caseStudy.challenge}
                </p>
              </CardContent>
            </Card>

            {/* Solution */}
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold">The Solution</h2>
                </div>
                <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
                  {caseStudy.solution}
                </p>
              </CardContent>
            </Card>

            {/* Implementation */}
            {caseStudy.implementation && (
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-bold">Implementation</h2>
                  </div>
                  <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
                    {caseStudy.implementation}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold">The Results</h2>
                </div>
                <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line mb-6">
                  {caseStudy.results}
                </p>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {caseStudy.metricTimeToHire && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                        <Clock className="h-5 w-5" />
                        <span className="text-sm font-medium">Time to Hire</span>
                      </div>
                      <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                        -{caseStudy.metricTimeToHire} days
                      </p>
                    </div>
                  )}
                  {caseStudy.metricCostSavings && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                        <TrendingUp className="h-5 w-5" />
                        <span className="text-sm font-medium">Cost Savings</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                        {formatMetric(caseStudy.metricCostSavings)}
                      </p>
                    </div>
                  )}
                  {caseStudy.metricQualityImprovement && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                        <Target className="h-5 w-5" />
                        <span className="text-sm font-medium">Quality Improvement</span>
                      </div>
                      <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                        {formatMetric(caseStudy.metricQualityImprovement)}
                      </p>
                    </div>
                  )}
                  {caseStudy.metricProductivityGain && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-2">
                        <TrendingUp className="h-5 w-5" />
                        <span className="text-sm font-medium">Productivity Gain</span>
                      </div>
                      <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                        {formatMetric(caseStudy.metricProductivityGain)}
                      </p>
                    </div>
                  )}
                  {caseStudy.metricCustom1Label && caseStudy.metricCustom1Value && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-sm font-medium">{caseStudy.metricCustom1Label}</span>
                      </div>
                      <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">
                        {caseStudy.metricCustom1Value}
                      </p>
                    </div>
                  )}
                  {caseStudy.metricCustom2Label && caseStudy.metricCustom2Value && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 mb-2">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-sm font-medium">{caseStudy.metricCustom2Label}</span>
                      </div>
                      <p className="text-3xl font-bold text-pink-700 dark:text-pink-300">
                        {caseStudy.metricCustom2Value}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Testimonial */}
            {caseStudy.testimonialQuote && (
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10">
                <CardContent className="p-8">
                  <Quote className="h-12 w-12 text-blue-300 dark:text-blue-700 mb-4" />
                  <blockquote className="text-xl italic leading-relaxed mb-4">
                    "{caseStudy.testimonialQuote}"
                  </blockquote>
                  {caseStudy.testimonialAuthor && (
                    <p className="font-semibold text-muted-foreground">
                      — {caseStudy.testimonialAuthor}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Video */}
            {caseStudy.videoUrl && (
              <Card>
                <CardContent className="p-0">
                  <div className="aspect-video">
                    <iframe
                      src={caseStudy.videoUrl}
                      className="w-full h-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-4">Company Information</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Company</p>
                    <p className="font-semibold">{caseStudy.customerName}</p>
                  </div>
                  {caseStudy.industry && (
                    <div>
                      <p className="text-muted-foreground mb-1">Industry</p>
                      <Badge variant="secondary">{caseStudy.industry}</Badge>
                    </div>
                  )}
                  {caseStudy.companySize && (
                    <div>
                      <p className="text-muted-foreground mb-1">Company Size</p>
                      <p className="font-semibold">{caseStudy.companySize} employees</p>
                    </div>
                  )}
                  {caseStudy.location && (
                    <div>
                      <p className="text-muted-foreground mb-1">Location</p>
                      <p className="font-semibold">{caseStudy.location}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-6">
                <h3 className="font-bold mb-2">Ready to transform your recruitment?</h3>
                <p className="text-sm mb-4 opacity-90">
                  See how Oracle Smart Recruitment can help your organization achieve similar results.
                </p>
                <Button variant="secondary" className="w-full" onClick={() => setLocation("/enterprise")}>
                  Request a Demo
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
