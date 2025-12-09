import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Star, Quote, Building2, Users } from "lucide-react";
import { APP_TITLE } from "@/const";

export default function Testimonials() {
  const { data: testimonials, isLoading } = trpc.testimonials.getAll.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const featuredTestimonials = testimonials?.filter((t: any) => t.isFeatured) || [];
  const regularTestimonials = testimonials?.filter((t: any) => !t.isFeatured) || [];

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Star
            key={idx}
            className={`h-5 w-5 ${
              idx < rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {APP_TITLE}
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Home
            </a>
            <a href="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Pricing
            </a>
            <a href="/testimonials" className="text-sm font-medium text-primary">
              Testimonials
            </a>
            <a href="/blog" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Blog
            </a>
            <Button variant="default" size="sm" asChild>
              <a href="/dashboard">Get Started</a>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
            Trusted by Leading Companies
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Discover how organizations worldwide are transforming their recruitment with Oracle Smart Recruitment
          </p>
        </div>
      </section>

      {/* Featured Testimonials */}
      {featuredTestimonials.length > 0 && (
        <section className="pb-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Featured Success Stories</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {featuredTestimonials.map((testimonial) => (
                <Card
                  key={testimonial.id}
                  className="relative bg-gradient-to-br from-white to-blue-50 border-primary/20 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <CardContent className="pt-6">
                    <Quote className="h-8 w-8 text-primary/20 mb-4" />
                    
                    <div className="mb-4">{renderStars(testimonial.rating)}</div>

                    <p className="text-slate-700 mb-6 leading-relaxed">
                      "{testimonial.testimonialText}"
                    </p>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                        {testimonial.customerName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{testimonial.customerName}</p>
                        <p className="text-sm text-slate-600">{testimonial.customerTitle}</p>
                        <p className="text-sm text-slate-500">{testimonial.company}</p>
                      </div>
                    </div>

                    {testimonial.results && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs font-semibold text-primary mb-1">Results Achieved:</p>
                        <p className="text-sm text-slate-600">{testimonial.results}</p>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      {testimonial.industry && (
                        <Badge variant="secondary" className="text-xs">
                          <Building2 className="h-3 w-3 mr-1" />
                          {testimonial.industry}
                        </Badge>
                      )}
                      {testimonial.companySize && (
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {testimonial.companySize}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Regular Testimonials */}
      {regularTestimonials.length > 0 && (
        <section className="pb-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {regularTestimonials.map((testimonial) => (
                <Card key={testimonial.id} className="bg-white hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="mb-3">{renderStars(testimonial.rating)}</div>

                    <p className="text-slate-700 mb-4 text-sm leading-relaxed">
                      "{testimonial.testimonialText}"
                    </p>

                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-bold text-sm">
                        {testimonial.customerName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{testimonial.customerName}</p>
                        <p className="text-xs text-slate-600">{testimonial.customerTitle}</p>
                        <p className="text-xs text-slate-500">{testimonial.company}</p>
                      </div>
                    </div>

                    {testimonial.results && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-slate-600">{testimonial.results}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Recruitment?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join hundreds of companies already using Oracle Smart Recruitment
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <a href="/pricing">View Pricing</a>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600" asChild>
              <a href="/dashboard">Start Free Trial</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-400">© 2024 {APP_TITLE}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
