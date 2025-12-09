import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, Users, Clock, Eye, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function CaseStudies() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");

  const { data: caseStudies, isLoading } = trpc.caseStudies.getWithFilters.useQuery({
    searchTerm: searchTerm || undefined,
    industry: industryFilter || undefined,
    isPublished: true,
    sortBy: "displayOrder",
    sortOrder: "desc"
  });

  const { data: featured } = trpc.caseStudies.getFeatured.useQuery();

  const formatMetric = (value: number | null, suffix: string = "%") => {
    if (!value) return null;
    return `${value}${suffix}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">Customer Success Stories</h1>
          <p className="text-xl max-w-2xl mx-auto opacity-90">
            Discover how leading companies transformed their recruitment with Oracle Smart Recruitment
          </p>
        </div>
      </div>

      <div className="container mx-auto py-12">
        {/* Featured Case Study */}
        {featured && featured.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Featured Success Story</h2>
            <Card className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setLocation(`/case-studies/${featured[0].slug}`)}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                {featured[0].coverImage && (
                  <div className="h-80 lg:h-auto bg-muted">
                    <img
                      src={featured[0].coverImage}
                      alt={featured[0].title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-8 flex flex-col justify-center">
                  {featured[0].customerLogo && (
                    <img
                      src={featured[0].customerLogo}
                      alt={featured[0].customerName}
                      className="h-12 w-auto mb-6 object-contain"
                    />
                  )}
                  <h3 className="text-3xl font-bold mb-4">{featured[0].title}</h3>
                  <p className="text-muted-foreground mb-6 line-clamp-3">
                    {featured[0].challenge}
                  </p>
                  
                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {featured[0].metricTimeToHire && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm font-medium">Time to Hire</span>
                        </div>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          -{featured[0].metricTimeToHire} days
                        </p>
                      </div>
                    )}
                    {featured[0].metricCostSavings && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm font-medium">Cost Savings</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {formatMetric(featured[0].metricCostSavings)}
                        </p>
                      </div>
                    )}
                  </div>

                  <Button className="w-fit">
                    Read Full Story
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search case studies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Industries</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Case Studies Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        ) : caseStudies && caseStudies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {caseStudies.map((caseStudy) => (
              <Card
                key={caseStudy.id}
                className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => setLocation(`/case-studies/${caseStudy.slug}`)}
              >
                {caseStudy.coverImage && (
                  <div className="h-48 bg-muted overflow-hidden">
                    <img
                      src={caseStudy.coverImage}
                      alt={caseStudy.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardContent className="p-6">
                  {caseStudy.customerLogo && (
                    <img
                      src={caseStudy.customerLogo}
                      alt={caseStudy.customerName}
                      className="h-8 w-auto mb-4 object-contain"
                    />
                  )}
                  
                  <div className="flex items-center gap-2 mb-3">
                    {caseStudy.industry && (
                      <Badge variant="secondary">{caseStudy.industry}</Badge>
                    )}
                    {caseStudy.companySize && (
                      <Badge variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        {caseStudy.companySize}
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {caseStudy.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {caseStudy.challenge}
                  </p>

                  {/* Key Metrics */}
                  {(caseStudy.metricTimeToHire || caseStudy.metricCostSavings || caseStudy.metricQualityImprovement) && (
                    <div className="space-y-2 mb-4 pt-4 border-t">
                      {caseStudy.metricTimeToHire && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Time to Hire Reduced</span>
                          <span className="font-semibold text-green-600">-{caseStudy.metricTimeToHire} days</span>
                        </div>
                      )}
                      {caseStudy.metricCostSavings && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Cost Savings</span>
                          <span className="font-semibold text-blue-600">{formatMetric(caseStudy.metricCostSavings)}</span>
                        </div>
                      )}
                      {caseStudy.metricQualityImprovement && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Quality Improvement</span>
                          <span className="font-semibold text-purple-600">{formatMetric(caseStudy.metricQualityImprovement)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {caseStudy.viewCount || 0} views
                    </span>
                    <span className="text-primary group-hover:underline">Read more →</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No case studies found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
