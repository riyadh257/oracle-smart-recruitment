import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Target, Users, Zap, Award, Globe, Heart, TrendingUp, Play, Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

export default function AboutUs() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  const testimonials = [
    {
      name: "Jennifer Martinez",
      role: "VP of HR, TechCorp Inc.",
      company: "TechCorp",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jennifer",
      rating: 5,
      text: "Oracle Smart Recruitment has transformed our hiring process. We've reduced time-to-hire by 60% and found better quality candidates. The AI screening is incredibly accurate and saves our team countless hours."
    },
    {
      name: "Robert Chen",
      role: "CEO, StartupHub",
      company: "StartupHub",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Robert",
      rating: 5,
      text: "As a fast-growing startup, we needed a recruitment solution that could scale with us. Oracle delivered beyond our expectations. The platform is intuitive, powerful, and has helped us build an amazing team."
    },
    {
      name: "Lisa Thompson",
      role: "Talent Acquisition Manager, Global Enterprises",
      company: "Global Enterprises",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
      rating: 5,
      text: "The diversity analytics and bias reduction features are game-changers. We've seen a significant improvement in candidate diversity and our hiring managers love the structured interview tools."
    },
    {
      name: "Ahmed Hassan",
      role: "Director of Operations, FinanceFlow",
      company: "FinanceFlow",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed",
      rating: 5,
      text: "The ROI has been incredible. Not only are we hiring faster, but the quality of hires has improved dramatically. The predictive analytics help us make data-driven decisions with confidence."
    },
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const teamMembers = [
    {
      name: "Sarah Johnson",
      role: "CEO & Founder",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      bio: "15+ years in HR technology and talent acquisition",
    },
    {
      name: "Michael Chen",
      role: "CTO",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
      bio: "Former AI researcher with expertise in machine learning",
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Product",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
      bio: "Product leader passionate about user experience",
    },
    {
      name: "David Kim",
      role: "Head of Customer Success",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
      bio: "Dedicated to helping companies build great teams",
    },
  ];

  const values = [
    {
      icon: <Target className="h-8 w-8" />,
      title: "Innovation First",
      description: "We constantly push boundaries to bring cutting-edge AI technology to recruitment",
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "People-Centric",
      description: "Every feature is designed with both recruiters and candidates in mind",
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Inclusive Hiring",
      description: "We're committed to reducing bias and promoting diversity in recruitment",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Speed & Efficiency",
      description: "Helping companies hire faster without compromising on quality",
    },
  ];

  const milestones = [
    { year: "2020", event: "Company Founded", description: "Started with a vision to transform recruitment" },
    { year: "2021", event: "First 100 Customers", description: "Reached our first major milestone" },
    { year: "2022", event: "AI Screening Launch", description: "Introduced revolutionary AI-powered resume screening" },
    { year: "2023", event: "Series A Funding", description: "Raised $10M to accelerate growth" },
    { year: "2024", event: "Global Expansion", description: "Serving customers in 50+ countries" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Oracle Smart Recruitment
              </span>
            </div>
            <Button variant="outline" onClick={() => window.history.back()}>
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            About Us
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            We're on a mission to revolutionize recruitment by combining artificial intelligence with human expertise,
            making hiring faster, fairer, and more effective for companies worldwide.
          </p>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-4xl font-bold mb-8 text-center text-gray-900">See Oracle in Action</h2>
          <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
            Watch how we're transforming recruitment for companies around the world
          </p>
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-blue-100 to-purple-100">
            {!showVideo ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group" onClick={() => setShowVideo(true)}>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Play className="h-10 w-10 text-blue-600 ml-1" />
                  </div>
                  <p className="text-white text-xl font-semibold drop-shadow-lg">Watch Our Story</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  <Building2 className="h-64 w-64 text-blue-600" />
                </div>
              </div>
            ) : (
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="Oracle Smart Recruitment Introduction"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            )}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-gray-900">Our Story</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Oracle Smart Recruitment was born from a simple observation: traditional hiring processes were broken.
                  Recruiters spent countless hours manually screening resumes, while great candidates fell through the cracks.
                </p>
                <p>
                  In 2020, our founders—veterans of both HR technology and artificial intelligence—came together with a vision
                  to transform recruitment. We believed that AI could augment human decision-making, not replace it, making
                  the hiring process faster and more equitable.
                </p>
                <p>
                  Today, we serve hundreds of companies worldwide, from startups to Fortune 500 enterprises, helping them
                  build exceptional teams through intelligent automation and data-driven insights.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <Users className="h-32 w-32 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold mb-12 text-center text-gray-900">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="py-16 px-4 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-4xl font-bold mb-4 text-center text-gray-900">What Our Customers Say</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Don't just take our word for it—hear from companies that have transformed their hiring with Oracle
          </p>
          <div className="relative">
            <Card className="shadow-xl">
              <CardContent className="pt-8 pb-8">
                <div className="flex flex-col items-center text-center">
                  <Quote className="h-12 w-12 text-blue-600 mb-6 opacity-50" />
                  <div className="flex gap-1 mb-6">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-xl text-gray-700 leading-relaxed mb-8 max-w-3xl italic">
                    "{testimonials[currentTestimonial].text}"
                  </p>
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonials[currentTestimonial].image}
                      alt={testimonials[currentTestimonial].name}
                      className="w-16 h-16 rounded-full bg-gray-100"
                    />
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{testimonials[currentTestimonial].name}</p>
                      <p className="text-sm text-gray-600">{testimonials[currentTestimonial].role}</p>
                      <p className="text-sm text-blue-600 font-medium">{testimonials[currentTestimonial].company}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={prevTestimonial}
                className="rounded-full"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentTestimonial
                        ? "bg-blue-600 w-8"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={nextTestimonial}
                className="rounded-full"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold mb-4 text-center text-gray-900">Meet Our Team</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            We're a diverse team of technologists, HR experts, and customer advocates united by a passion for transforming recruitment.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="text-center hover:shadow-xl transition-all hover:-translate-y-1 group">
                <CardContent className="pt-6">
                  <div className="relative mb-4">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-24 h-24 rounded-full mx-auto bg-gray-100 ring-4 ring-blue-100 group-hover:ring-blue-200 transition-all"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600/0 to-purple-600/0 group-hover:from-blue-600/10 group-hover:to-purple-600/10 transition-all"></div>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-1 text-gray-900">{member.name}</h3>
                  <p className="text-blue-600 font-medium mb-2">{member.role}</p>
                  <p className="text-sm text-gray-600">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our Journey */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold mb-12 text-center text-gray-900">Our Journey</h2>
          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                    {milestone.year}
                  </div>
                </div>
                <div className="flex-1 pb-8 border-b border-gray-200 last:border-0">
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">{milestone.event}</h3>
                  <p className="text-gray-600">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
                <Target className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
              <p className="text-lg leading-relaxed text-blue-50">
                To empower organizations worldwide with intelligent recruitment technology that accelerates hiring,
                reduces bias, and helps build diverse, high-performing teams.
              </p>
            </div>
            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
                <TrendingUp className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
              <p className="text-lg leading-relaxed text-blue-50">
                A world where every company, regardless of size, has access to enterprise-grade recruitment tools
                that level the playing field in the war for talent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">Companies Served</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">50K+</div>
              <div className="text-gray-600">Candidates Hired</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">70%</div>
              <div className="text-gray-600">Time Saved</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">50+</div>
              <div className="text-gray-600">Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Award className="h-16 w-16 mx-auto mb-6 text-blue-600" />
          <h2 className="text-4xl font-bold mb-6 text-gray-900">Join Us on Our Mission</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Whether you're looking to transform your hiring process or join our team,
            we'd love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => window.location.href = "/enterprise-quote"}
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.location.href = "mailto:careers@oracle-recruitment.com"}
            >
              Join Our Team
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
