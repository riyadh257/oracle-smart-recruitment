import { useState, useCallback, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Play, Pause, Clock, GitBranch, CheckCircle, AlertCircle, Zap } from "lucide-react";
import { toast } from "sonner";
import { SmartSendTimeOptimizer } from "./SmartSendTimeOptimizer";

interface WorkflowNode {
  id: string;
  type: "trigger" | "action" | "condition" | "delay" | "end";
  label: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  connections: string[];
}

interface EmailCampaignBuilderProps {
  employerId: number;
  campaignId?: number;
  onSaved?: () => void;
}

export function EmailCampaignBuilder({
  employerId,
  campaignId,
  onSaved,
}: EmailCampaignBuilderProps) {
  const [campaignName, setCampaignName] = useState("");
  const [campaignDescription, setCampaignDescription] = useState("");
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);
  const [showSendTimeOptimizer, setShowSendTimeOptimizer] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Fetch existing campaign if editing
  const { data: campaign } = trpc.campaigns.getById.useQuery(
    { campaignId: campaignId! },
    { enabled: !!campaignId }
  );

  const createMutation = trpc.campaigns.create.useMutation({
    onSuccess: () => {
      toast.success("Campaign created successfully!");
      onSaved?.();
    },
  });

  const updateMutation = trpc.campaigns.update.useMutation({
    onSuccess: () => {
      toast.success("Campaign updated successfully!");
      onSaved?.();
    },
  });

  useEffect(() => {
    if (campaign) {
      setCampaignName(campaign.name);
      setCampaignDescription(campaign.description || "");
      if (campaign.workflowDefinition) {
        const workflow = campaign.workflowDefinition as any;
        setNodes(workflow.nodes || []);
      }
    }
  }, [campaign]);

  const nodeTypes = [
    { type: "trigger", label: "Trigger", icon: Play, color: "bg-blue-500" },
    { type: "action", label: "Send Email", icon: Mail, color: "bg-green-500" },
    { type: "condition", label: "Condition", icon: GitBranch, color: "bg-yellow-500" },
    { type: "delay", label: "Delay", icon: Clock, color: "bg-purple-500" },
    { type: "end", label: "End", icon: CheckCircle, color: "bg-gray-500" },
  ];

  const handleDragStart = (nodeType: string) => {
    setDraggedNodeType(nodeType);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedNodeType || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type: draggedNodeType as any,
      label: nodeTypes.find((t) => t.type === draggedNodeType)?.label || draggedNodeType,
      config: {},
      position: { x, y },
      connections: [],
    };

    setNodes([...nodes, newNode]);
    setDraggedNodeType(null);
  };

  const handleNodeClick = (node: WorkflowNode) => {
    setSelectedNode(node);
    setShowNodeConfig(true);
  };

  const handleNodeConfigSave = (config: Record<string, any>) => {
    if (!selectedNode) return;

    setNodes(
      nodes.map((node) =>
        node.id === selectedNode.id ? { ...node, config } : node
      )
    );
    setShowNodeConfig(false);
    setSelectedNode(null);
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(nodes.filter((node) => node.id !== nodeId));
    // Remove connections to this node
    setNodes((prevNodes) =>
      prevNodes.map((node) => ({
        ...node,
        connections: node.connections.filter((id) => id !== nodeId),
      }))
    );
  };

  const handleConnectNodes = (fromId: string, toId: string) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === fromId
          ? { ...node, connections: [...node.connections, toId] }
          : node
      )
    );
  };

  const handleSaveCampaign = () => {
    if (!campaignName) {
      toast.error("Please enter a campaign name");
      return;
    }

    if (nodes.length === 0) {
      toast.error("Please add at least one node to the workflow");
      return;
    }

    const workflowDefinition = {
      nodes,
      startNodeId: nodes[0]?.id || "",
    };

    if (campaignId) {
      updateMutation.mutate({
        campaignId,
        name: campaignName,
        description: campaignDescription,
        workflowDefinition,
      });
    } else {
      createMutation.mutate({
        employerId,
        name: campaignName,
        description: campaignDescription,
        workflowDefinition,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Campaign Details */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>Configure your email automation campaign</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g., Welcome Series, Follow-up Campaign"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={campaignDescription}
              onChange={(e) => setCampaignDescription(e.target.value)}
              placeholder="Describe the purpose of this campaign..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Workflow Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Builder</CardTitle>
          <CardDescription>
            Drag and drop nodes to create your email automation workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Node Palette */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Workflow Nodes</Label>
              <div className="space-y-2">
                {nodeTypes.map((nodeType) => {
                  const Icon = nodeType.icon;
                  return (
                    <div
                      key={nodeType.type}
                      draggable
                      onDragStart={() => handleDragStart(nodeType.type)}
                      className={`${nodeType.color} text-white p-3 rounded-lg cursor-move hover:opacity-90 transition-opacity flex items-center gap-2`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{nodeType.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Canvas */}
            <div className="lg:col-span-3">
              <div
                ref={canvasRef}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="relative border-2 border-dashed border-gray-300 rounded-lg min-h-[500px] bg-gray-50"
              >
                {nodes.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                      <p>Drag nodes here to build your workflow</p>
                    </div>
                  </div>
                )}

                {/* Render Nodes */}
                {nodes.map((node) => {
                  const nodeTypeInfo = nodeTypes.find((t) => t.type === node.type);
                  const Icon = nodeTypeInfo?.icon || Mail;
                  return (
                    <div
                      key={node.id}
                      style={{
                        position: "absolute",
                        left: node.position.x,
                        top: node.position.y,
                      }}
                      onClick={() => handleNodeClick(node)}
                      className={`${nodeTypeInfo?.color} text-white p-4 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow min-w-[120px]`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-semibold">{node.label}</span>
                      </div>
                      {Object.keys(node.config).length > 0 && (
                        <Badge variant="secondary" className="text-xs mt-2">
                          Configured
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 text-white hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNode(node.id);
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  );
                })}

                {/* Render Connections */}
                <svg
                  className="absolute inset-0 pointer-events-none"
                  style={{ width: "100%", height: "100%" }}
                >
                  {nodes.map((node) =>
                    node.connections.map((targetId) => {
                      const targetNode = nodes.find((n) => n.id === targetId);
                      if (!targetNode) return null;

                      return (
                        <line
                          key={`${node.id}-${targetId}`}
                          x1={node.position.x + 60}
                          y1={node.position.y + 30}
                          x2={targetNode.position.x + 60}
                          y2={targetNode.position.y + 30}
                          stroke="#3b82f6"
                          strokeWidth="2"
                          markerEnd="url(#arrowhead)"
                        />
                      );
                    })
                  )}
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="10"
                      refX="9"
                      refY="3"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
                    </marker>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Send Time Optimization Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Smart Send Time Optimization
          </CardTitle>
          <CardDescription>
            AI-powered recommendations for optimal email send times
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => setShowSendTimeOptimizer(true)}
            className="w-full"
          >
            <Clock className="h-4 w-4 mr-2" />
            View Send Time Recommendations
          </Button>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setNodes([])}>
          Clear Workflow
        </Button>
        <Button
          onClick={handleSaveCampaign}
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {createMutation.isPending || updateMutation.isPending
            ? "Saving..."
            : campaignId
            ? "Update Campaign"
            : "Create Campaign"}
        </Button>
      </div>

      {/* Node Configuration Dialog */}
      <NodeConfigDialog
        open={showNodeConfig}
        node={selectedNode}
        onClose={() => {
          setShowNodeConfig(false);
          setSelectedNode(null);
        }}
        onSave={handleNodeConfigSave}
      />

      {/* Send Time Optimizer Dialog */}
      <Dialog open={showSendTimeOptimizer} onOpenChange={setShowSendTimeOptimizer}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Smart Send Time Optimization</DialogTitle>
            <DialogDescription>
              AI-powered analysis of optimal send times based on historical engagement data
            </DialogDescription>
          </DialogHeader>
          <SmartSendTimeOptimizer segment={{}} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Node Configuration Dialog Component
interface NodeConfigDialogProps {
  open: boolean;
  node: WorkflowNode | null;
  onClose: () => void;
  onSave: (config: Record<string, any>) => void;
}

function NodeConfigDialog({ open, node, onClose, onSave }: NodeConfigDialogProps) {
  const [config, setConfig] = useState<Record<string, any>>({});

  useEffect(() => {
    if (node) {
      setConfig(node.config || {});
    }
  }, [node]);

  const handleSave = () => {
    onSave(config);
  };

  if (!node) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure {node.label}</DialogTitle>
          <DialogDescription>
            Set up the configuration for this workflow node
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {node.type === "trigger" && (
            <div>
              <Label>Trigger Event</Label>
              <Select
                value={config.triggerType || ""}
                onValueChange={(value) => setConfig({ ...config, triggerType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="application_submitted">Application Submitted</SelectItem>
                  <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                  <SelectItem value="interview_completed">Interview Completed</SelectItem>
                  <SelectItem value="application_rejected">Application Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {node.type === "action" && (
            <>
              <div>
                <Label>Email Subject</Label>
                <Input
                  value={config.subject || ""}
                  onChange={(e) => setConfig({ ...config, subject: e.target.value })}
                  placeholder="Enter email subject (use {{firstName}}, {{lastName}}, {{position}} for variables)"
                />
              </div>
              <div>
                <Label>Email Content</Label>
                <Textarea
                  value={config.emailContent || ""}
                  onChange={(e) => setConfig({ ...config, emailContent: e.target.value })}
                  placeholder="Enter email content (HTML supported, use {{firstName}}, {{lastName}}, {{position}}, {{company}} for variables)"
                  rows={6}
                />
              </div>
              
              {/* Real-time Preview Panel */}
              <div className="border-t pt-4 mt-4">
                <Label className="text-sm font-semibold mb-2 block">Preview with Sample Data</Label>
                <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Subject:</div>
                    <div className="font-semibold">
                      {renderPreview(config.subject || "", getSampleData())}
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <div className="text-xs text-gray-500 mb-2">Body:</div>
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: renderPreview(config.emailContent || "", getSampleData()) 
                      }}
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Available variables: {{firstName}}, {{lastName}}, {{position}}, {{company}}, {{email}}
                </div>
              </div>
            </>
          )}

          {node.type === "condition" && (
            <>
              <div>
                <Label>Condition Type</Label>
                <Select
                  value={config.conditionType || ""}
                  onValueChange={(value) => setConfig({ ...config, conditionType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email_opened">Email Opened</SelectItem>
                    <SelectItem value="email_clicked">Email Clicked</SelectItem>
                    <SelectItem value="time_elapsed">Time Elapsed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {config.conditionType === "time_elapsed" && (
                <div>
                  <Label>Minutes</Label>
                  <Input
                    type="number"
                    value={config.conditionValue || ""}
                    onChange={(e) =>
                      setConfig({ ...config, conditionValue: Number(e.target.value) })
                    }
                    placeholder="Enter minutes"
                  />
                </div>
              )}
            </>
          )}

          {node.type === "delay" && (
            <div>
              <Label>Delay (minutes)</Label>
              <Input
                type="number"
                value={config.delayMinutes || ""}
                onChange={(e) =>
                  setConfig({ ...config, delayMinutes: Number(e.target.value) })
                }
                placeholder="Enter delay in minutes"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper functions for email preview
function getSampleData() {
  return {
    firstName: "John",
    lastName: "Smith",
    position: "Senior Software Engineer",
    company: "Oracle Corporation",
    email: "john.smith@example.com",
  };
}

function renderPreview(template: string, data: Record<string, string>): string {
  if (!template) return "";
  
  let result = template;
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
}
