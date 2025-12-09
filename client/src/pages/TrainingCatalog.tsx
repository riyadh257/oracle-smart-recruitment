import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Clock, Star, Users, Award, Search, Filter } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function TrainingCatalog() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  const { data: programs, isLoading } = trpc.training.listPrograms.useQuery({
    category: selectedCategory !== "all" ? selectedCategory as any : undefined,
    level: selectedLevel !== "all" ? selectedLevel as any : undefined,
    isFree: showFreeOnly ? true : undefined,
    limit: 50,
  });

  const { data: featuredPrograms } = trpc.training.getFeaturedPrograms.useQuery({ limit: 3 });

  const enrollMutation = trpc.training.enrollInProgram.useMutation({
    onSuccess: () => {
      toast.success("Successfully enrolled! Start learning now.");
      setLocation("/my-learning");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to enroll");
    },
  });

  const handleEnroll = (programId: number) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to enroll in courses");
      return;
    }
    enrollMutation.mutate({ programId });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return '💻';
      case 'soft_skills': return '🤝';
      case 'industry_specific': return '🏢';
      case 'certification': return '📜';
      case 'language': return '🌍';
      case 'leadership': return '👔';
      default: return '📚';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container max-w-6xl">
          <h1 className="text-4xl font-bold mb-4">Skill Development Programs</h1>
          <p className="text-xl text-blue-100 mb-8">
            Learn new skills, earn certifications, and advance your career
          </p>
          
          {/* Search Bar */}
          <div className="flex gap-4 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <Button variant="secondary">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl py-8">
        {/* Featured Programs */}
        {featuredPrograms && featuredPrograms.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
              Featured Programs
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredPrograms.map((program) => (
                <Card key={program.id} className="border-2 border-yellow-200 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-3xl">{getCategoryIcon(program.category)}</span>
                      <Badge className={getLevelColor(program.level)}>
                        {program.level}
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-2">{program.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {program.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {program.duration}h
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {program.enrollmentCount}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {(program.averageRating / 100).toFixed(1)}
                      </div>
                    </div>
                    {program.certificateAwarded === 1 && (
                      <Badge variant="outline" className="mt-3">
                        <Award className="h-3 w-3 mr-1" />
                        Certificate Included
                      </Badge>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <div className="text-lg font-bold">
                      {program.isFree ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        <span>${(program.price / 100).toFixed(2)}</span>
                      )}
                    </div>
                    <Button onClick={() => handleEnroll(program.id)}>
                      Enroll Now
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="soft_skills">Soft Skills</SelectItem>
              <SelectItem value="industry_specific">Industry Specific</SelectItem>
              <SelectItem value="certification">Certification</SelectItem>
              <SelectItem value="language">Language</SelectItem>
              <SelectItem value="leadership">Leadership</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={showFreeOnly ? "default" : "outline"}
            onClick={() => setShowFreeOnly(!showFreeOnly)}
          >
            Free Courses Only
          </Button>
        </div>

        {/* All Programs */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            All Programs
          </h2>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : programs && programs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((program) => (
                <Card key={program.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setLocation(`/training/${program.id}`)}>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-3xl">{getCategoryIcon(program.category)}</span>
                      <Badge className={getLevelColor(program.level)}>
                        {program.level}
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-2">{program.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {program.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {program.duration}h
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {program.enrollmentCount}
                      </div>
                      {program.averageRating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {(program.averageRating / 100).toFixed(1)}
                        </div>
                      )}
                    </div>
                    {program.certificateAwarded === 1 && (
                      <Badge variant="outline">
                        <Award className="h-3 w-3 mr-1" />
                        Certificate
                      </Badge>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <div className="text-lg font-bold">
                      {program.isFree ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        <span>${(program.price / 100).toFixed(2)}</span>
                      )}
                    </div>
                    <Button onClick={(e) => {
                      e.stopPropagation();
                      handleEnroll(program.id);
                    }}>
                      Enroll
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No programs found matching your criteria</p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
