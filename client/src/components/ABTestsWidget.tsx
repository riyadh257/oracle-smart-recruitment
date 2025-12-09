import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowRight, FlaskConical, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

export function ABTestsWidget() {
  const [, setLocation] = useLocation();
  const { data: tests, isLoading } = trpc.ruleAbTesting.list.useQuery({});

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active A/B Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeTests = tests || [];
  const totalTests = activeTests.length;

  // Calculate average performance across all active tests
  const avgPerformance = activeTests.length > 0
    ? activeTests.reduce((sum: number, test: any) => {
        const variantA = test.results?.find((r: any) => r.variantId === test.variantAId);
        const variantB = test.results?.find((r: any) => r.variantId === test.variantBId);
        
        const rateA = variantA ? (variantA.opens / variantA.sends) : 0;
        const rateB = variantB ? (variantB.opens / variantB.sends) : 0;
        
        return sum + Math.max(rateA, rateB);
      }, 0) / activeTests.length
    : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <FlaskConical className="h-5 w-5" />
          Active A/B Tests
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setLocation("/email-templates")}
        >
          View All <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {totalTests > 0 ? (
          <div className="space-y-4">
            <div>
              <div className="text-2xl font-bold">{totalTests}</div>
              <p className="text-sm text-muted-foreground">
                Running Tests
              </p>
            </div>

            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">
                {(avgPerformance * 100).toFixed(1)}%
              </span>
              <span className="text-sm text-muted-foreground">
                Avg. Open Rate
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t">
              {activeTests.slice(0, 3).map((test: any) => {
                const variantA = test.results?.find((r: any) => r.variantId === test.variantAId);
                const variantB = test.results?.find((r: any) => r.variantId === test.variantBId);
                
                const sendsA = variantA?.sends || 0;
                const sendsB = variantB?.sends || 0;
                const totalSends = sendsA + sendsB;

                return (
                  <div key={test.id} className="flex items-center justify-between text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{test.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {totalSends} sends
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      Active
                    </Badge>
                  </div>
                );
              })}
              
              {totalTests > 3 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{totalTests - 3} more tests
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <FlaskConical className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No active A/B tests</p>
            <Button 
              variant="link" 
              size="sm"
              onClick={() => setLocation("/email-templates")}
              className="mt-2"
            >
              Create Test
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
