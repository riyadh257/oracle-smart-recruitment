import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Link2, CheckCircle, XCircle, Plus, Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function EmployerATSIntegration() {
  const [, setLocation] = useLocation();
  const [atsProvider, setAtsProvider] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [apiEndpoint, setApiEndpoint] = useState("");

  const { data: integrations, refetch } = trpc.ats.getIntegrations.useQuery();
  const createIntegration = trpc.ats.createIntegration.useMutation({
    onSuccess: () => {
      toast.success("ATS integration created successfully");
      setAtsProvider("");
      setApiKey("");
      setApiEndpoint("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create integration");
    }
  });

  const testIntegration = trpc.ats.testIntegration.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Integration test successful!");
      } else {
        toast.error("Integration test failed: " + data.message);
      }
      refetch();
    }
  });

  const deleteIntegration = trpc.ats.deleteIntegration.useMutation({
    onSuccess: () => {
      toast.success("Integration deleted");
      refetch();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!atsProvider || !apiKey || !apiEndpoint) {
      toast.error("Please fill all fields");
      return;
    }

    createIntegration.mutate({
      atsProvider,
      apiKey,
      apiEndpoint
    });
  };

  const atsProviders = [
    { value: "oracle_taleo", label: "Oracle Taleo" },
    { value: "sap_successfactors", label: "SAP SuccessFactors" },
    { value: "greenhouse", label: "Greenhouse" },
    { value: "workday", label: "Workday" },
    { value: "lever", label: "Lever" },
    { value: "icims", label: "iCIMS" },
    { value: "bamboohr", label: "BambooHR" },
    { value: "other", label: "Other" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/employer/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Link2 className="h-6 w-6 text-blue-600" />
              ATS Integration
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Value Proposition Banner */}
        <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Link2 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-2">Seamless One-Click Application Flow</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Connect your existing Applicant Tracking System (ATS) to Oracle Smart Recruitment for
                  <strong className="text-blue-700"> automatic candidate data synchronization</strong>. Eliminate manual data entry,
                  reduce application friction, and maximize conversion rates with our "Indeed Apply" equivalent integration.
                </p>
                <div className="grid md:grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-blue-600 rounded-full"></div>
                    <span className="text-slate-700">One-click candidate applications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-indigo-600 rounded-full"></div>
                    <span className="text-slate-700">Automatic data synchronization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-purple-600 rounded-full"></div>
                    <span className="text-slate-700">Real-time status updates</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Add Integration Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-600" />
                  Add ATS Integration
                </CardTitle>
                <CardDescription>
                  Connect your Applicant Tracking System
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="atsProvider">ATS Provider</Label>
                    <Select value={atsProvider} onValueChange={setAtsProvider}>
                      <SelectTrigger id="atsProvider">
                        <SelectValue placeholder="Select your ATS" />
                      </SelectTrigger>
                      <SelectContent>
                        {atsProviders.map((provider: any) => (
                          <SelectItem key={provider.value} value={provider.value}>
                            {provider.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your ATS API key"
                    />
                  </div>

                  <div>
                    <Label htmlFor="apiEndpoint">API Endpoint</Label>
                    <Input
                      id="apiEndpoint"
                      value={apiEndpoint}
                      onChange={(e) => setApiEndpoint(e.target.value)}
                      placeholder="https://api.youratsystem.com"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={createIntegration.isPending}>
                    {createIntegration.isPending ? "Connecting..." : "Connect ATS"}
                  </Button>
                </form>

                <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600 mb-2">
                    <strong>Need help?</strong> Contact your ATS administrator to obtain API credentials.
                  </p>
                  <p className="text-xs text-slate-600">
                    Supported systems: Oracle Taleo, SAP SuccessFactors, Greenhouse, Workday, Lever, iCIMS, BambooHR
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Integration List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-blue-600" />
                  Connected Systems
                </CardTitle>
                <CardDescription>
                  Manage your ATS integrations and sync settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!integrations || integrations.length === 0 ? (
                  <div className="text-center py-12">
                    <Link2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No ATS integrations yet</h3>
                    <p className="text-slate-600">
                      Connect your ATS to enable seamless one-click applications
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {integrations.map((integration: any) => (
                      <Card key={integration.id} className="border-slate-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                  integration.status === 'active' ? 'bg-green-100' : 'bg-slate-100'
                                }`}>
                                  <Link2 className={`h-5 w-5 ${
                                    integration.status === 'active' ? 'text-green-600' : 'text-slate-600'
                                  }`} />
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-900 capitalize">
                                    {integration.atsProvider.replace('_', ' ')}
                                  </p>
                                  <p className="text-sm text-slate-600">{integration.apiEndpoint}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 ml-13 text-sm">
                                <span className={`flex items-center gap-1 ${
                                  integration.status === 'active' ? 'text-green-600' : 'text-slate-600'
                                }`}>
                                  {integration.status === 'active' ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                  {integration.status === 'active' ? 'Connected' : 'Disconnected'}
                                </span>
                                {integration.lastSyncAt && (
                                  <span className="text-slate-600">
                                    Last sync: {new Date(integration.lastSyncAt).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => testIntegration.mutate({ id: integration.id })}
                                disabled={testIntegration.isPending}
                              >
                                <SettingsIcon className="h-4 w-4 mr-1" />
                                Test
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteIntegration.mutate({ id: integration.id })}
                                disabled={deleteIntegration.isPending}
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Benefits Card */}
            <Card className="mt-6 border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-slate-900 mb-3">Benefits of ATS Integration</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Reduce application friction:</strong> Candidates apply with one click using their existing profile</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Eliminate manual data entry:</strong> Candidate information flows automatically to your ATS</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Maximize conversion rates:</strong> Studies show one-click apply increases applications by 300%+</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Real-time sync:</strong> Application status updates flow bidirectionally between systems</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
