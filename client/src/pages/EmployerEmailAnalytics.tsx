import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail } from "lucide-react";
import { useLocation } from "wouter";
import EmailAnalyticsDashboard from "@/components/EmailAnalyticsDashboard";
import AbTestingManager from "@/components/AbTestingManager";
import EmailTemplateLibrary from "@/components/EmailTemplateLibrary";
import MultivariateTestManager from "@/components/MultivariateTestManager";
import EmailScheduler from "@/components/EmailScheduler";
import WorkflowManager from "@/components/WorkflowManager";
import DeliverabilityMonitor from "@/components/DeliverabilityMonitor";
import CohortAnalysis from "@/components/CohortAnalysis";
import WarmupScheduler from "@/components/WarmupScheduler";
import ReplyManager from "@/components/ReplyManager";
import ContentOptimizer from "@/components/ContentOptimizer";
import CampaignManager from "@/components/CampaignManager";

export default function EmployerEmailAnalytics() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/employer/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Mail className="h-6 w-6 text-blue-600" />
              Email Analytics & A/B Testing
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full max-w-full grid-cols-12">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="abtesting">A/B Testing</TabsTrigger>
            <TabsTrigger value="multivariate">Multivariate</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="deliverability">Deliverability</TabsTrigger>
            <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
            <TabsTrigger value="warmup">Warmup</TabsTrigger>
            <TabsTrigger value="replies">Replies</TabsTrigger>
            <TabsTrigger value="optimizer">AI Optimizer</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <EmailAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="abtesting">
            <AbTestingManager />
          </TabsContent>

          <TabsContent value="multivariate">
            <MultivariateTestManager />
          </TabsContent>

          <TabsContent value="templates">
            <EmailTemplateLibrary />
          </TabsContent>
          
          <TabsContent value="scheduler">
            <EmailScheduler />
          </TabsContent>
          
          <TabsContent value="workflows">
            <WorkflowManager />
          </TabsContent>
          
          <TabsContent value="deliverability">
            <DeliverabilityMonitor />
          </TabsContent>
          
          <TabsContent value="cohorts">
            <CohortAnalysis />
          </TabsContent>
          
          <TabsContent value="warmup">
            <WarmupScheduler />
          </TabsContent>
          
          <TabsContent value="replies">
            <ReplyManager />
          </TabsContent>
          
          <TabsContent value="optimizer">
            <ContentOptimizer />
          </TabsContent>
          
          <TabsContent value="campaigns">
            <CampaignManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
