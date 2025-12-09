import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { APP_LOGO, APP_TITLE } from "@/const";
import { 
  BrainCircuit, 
  Calendar, 
  FileText, 
  Mail, 
  MessageSquare, 
  TrendingUp, 
  Users, 
  Zap,
  CheckCircle2,
  ArrowRight,
  Globe,
  Shield,
  Clock
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Marketing() {
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    company: "",
    message: ""
  });

  const contactMutation = trpc.marketing.submitContact.useMutation({
    onSuccess: () => {
      toast.success("شكراً لتواصلك معنا! سنرد عليك قريباً.");
      setContactForm({ name: "", email: "", company: "", message: "" });
    },
    onError: () => {
      toast.error("حدث خطأ. يرجى المحاولة مرة أخرى.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate(contactForm);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-10" />}
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {APP_TITLE}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-blue-600 transition-colors">الميزات</a>
              <a href="#benefits" className="text-slate-600 hover:text-blue-600 transition-colors">الفوائد</a>
              <a href="/pricing" className="text-slate-600 hover:text-blue-600 transition-colors">الأسعار</a>
              <a href="/about" className="text-slate-600 hover:text-blue-600 transition-colors">من نحن</a>
              <a href="#contact" className="text-slate-600 hover:text-blue-600 transition-colors">تواصل معنا</a>
              <Button asChild>
                <a href="/dashboard">تسجيل الدخول</a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full mb-6">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">نظام التوظيف الذكي المدعوم بالذكاء الاصطناعي</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              وظّف أفضل المواهب
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                بذكاء وسرعة
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              نظام توظيف شامل يستخدم الذكاء الاصطناعي لفحص السير الذاتية، جدولة المقابلات،
              وتحليل البيانات لمساعدتك في اتخاذ قرارات توظيف أفضل وأسرع.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" asChild>
                <a href="#contact">
                  ابدأ الآن مجاناً
                  <ArrowRight className="mr-2 h-5 w-5" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                <a href="#features">اكتشف الميزات</a>
              </Button>
            </div>
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>بدون بطاقة ائتمان</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>إعداد في 5 دقائق</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>دعم فني 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">ميزات قوية لتوظيف أذكى</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              كل ما تحتاجه لإدارة عملية التوظيف من البداية إلى النهاية
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-blue-500 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <BrainCircuit className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>فحص ذكي للسير الذاتية</CardTitle>
                <CardDescription>
                  يستخدم الذكاء الاصطناعي لتحليل السير الذاتية تلقائياً وتقييم المرشحين بناءً على متطلبات الوظيفة
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-blue-500 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle>جدولة المقابلات التلقائية</CardTitle>
                <CardDescription>
                  جدول المقابلات بسهولة مع كشف التعارضات وإرسال دعوات تلقائية عبر البريد الإلكتروني
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-blue-500 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>تحليلات متقدمة</CardTitle>
                <CardDescription>
                  احصل على رؤى عميقة حول عملية التوظيف مع لوحات تحكم تفاعلية وتقارير قابلة للتصدير
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-blue-500 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>بوابة المرشحين</CardTitle>
                <CardDescription>
                  يمكن للمرشحين التقديم مباشرة، تتبع حالة طلباتهم، وإعادة جدولة المقابلات بسهولة
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-blue-500 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>إشعارات ذكية</CardTitle>
                <CardDescription>
                  نظام إشعارات متقدم مع ملخصات يومية، تفضيلات قابلة للتخصيص، وترتيب أولويات تلقائي
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-blue-500 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>مقابلات فيديو</CardTitle>
                <CardDescription>
                  تكامل مع Zoom وTeams وGoogle Meet لإجراء مقابلات فيديو سلسة
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">لماذا تختار Oracle Smart Recruitment؟</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              وفر الوقت، قلل التكاليف، ووظف أفضل المواهب
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">وفر 70% من الوقت</h3>
                <p className="text-slate-600">
                  أتمتة المهام المتكررة مثل فحص السير الذاتية وجدولة المقابلات، مما يتيح لفريقك التركيز على التقييم الاستراتيجي
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">حسّن جودة التوظيف</h3>
                <p className="text-slate-600">
                  اتخذ قرارات مبنية على البيانات مع تحليلات الذكاء الاصطناعي والتنبؤات المستندة إلى التعيينات الناجحة السابقة
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">آمن ومتوافق</h3>
                <p className="text-slate-600">
                  حماية بيانات المرشحين مع تشفير من الدرجة المصرفية والامتثال الكامل لقوانين حماية البيانات
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Globe className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">قابل للتوسع عالمياً</h3>
                <p className="text-slate-600">
                  من الشركات الناشئة إلى المؤسسات الكبرى، ينمو نظامنا معك ويدعم التوظيف في مناطق زمنية ولغات متعددة
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">10K+</div>
              <div className="text-blue-100">مرشح تم فحصهم</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">500+</div>
              <div className="text-blue-100">شركة تثق بنا</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">70%</div>
              <div className="text-blue-100">توفير في الوقت</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">95%</div>
              <div className="text-blue-100">رضا العملاء</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">من نحن</h2>
              <p className="text-xl text-slate-600">
                نحن فريق من خبراء التكنولوجيا والموارد البشرية الملتزمين بتحويل عملية التوظيف
              </p>
            </div>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="prose prose-lg max-w-none text-slate-600 leading-relaxed">
                  <p className="mb-4">
                    تأسست Oracle Smart Recruitment برؤية واضحة: جعل التوظيف أكثر ذكاءً وكفاءة وإنصافاً. 
                    نحن نؤمن بأن التكنولوجيا يجب أن تمكّن فرق الموارد البشرية، وليس استبدالها.
                  </p>
                  <p className="mb-4">
                    يجمع نظامنا بين أحدث تقنيات الذكاء الاصطناعي وأفضل ممارسات الموارد البشرية لمساعدتك في 
                    العثور على المرشحين المثاليين بشكل أسرع. من الفحص الأولي إلى القرار النهائي، نوفر الأدوات 
                    التي تحتاجها لبناء فريق استثنائي.
                  </p>
                  <p>
                    انضم إلى مئات الشركات التي تحولت عملية التوظيف لديها مع Oracle Smart Recruitment.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">تواصل معنا</h2>
              <p className="text-xl text-slate-600">
                هل لديك أسئلة؟ فريقنا هنا لمساعدتك
              </p>
            </div>

            <Card className="border-2">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      الاسم الكامل *
                    </label>
                    <Input
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="أدخل اسمك"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      البريد الإلكتروني *
                    </label>
                    <Input
                      required
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      اسم الشركة
                    </label>
                    <Input
                      value={contactForm.company}
                      onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                      placeholder="اسم شركتك"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      رسالتك *
                    </label>
                    <Textarea
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="كيف يمكننا مساعدتك؟"
                      rows={5}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full"
                    disabled={contactMutation.isPending}
                  >
                    {contactMutation.isPending ? "جاري الإرسال..." : "إرسال الرسالة"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />}
                <span className="text-white font-bold text-lg">{APP_TITLE}</span>
              </div>
              <p className="text-sm">
                نظام التوظيف الذكي المدعوم بالذكاء الاصطناعي
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">المنتج</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">الميزات</a></li>
                <li><a href="#benefits" className="hover:text-white transition-colors">الفوائد</a></li>
                <li><a href="/dashboard" className="hover:text-white transition-colors">لوحة التحكم</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">الشركة</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#about" className="hover:text-white transition-colors">من نحن</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">تواصل معنا</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">تابعنا</h3>
              <div className="flex gap-4">
                <a href="#" className="hover:text-white transition-colors">
                  <FileText className="h-5 w-5" />
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>&copy; 2024 {APP_TITLE}. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
