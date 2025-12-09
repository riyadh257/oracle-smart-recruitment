import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Users, Mail, Trash2, Edit, Star, Tag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function TalentPool() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editStatus, setEditStatus] = useState<'active' | 'contacted' | 'hired' | 'not_interested'>('active');

  const { data: employer } = trpc.employer.getProfile.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: talentPool, isLoading } = trpc.talentPool.list.useQuery(
    { employerId: employer?.id || 0 },
    { enabled: !!employer?.id }
  );

  const removeMutation = trpc.talentPool.remove.useMutation({
    onSuccess: () => {
      utils.talentPool.list.invalidate();
      toast.success("Candidate removed from talent pool");
    },
    onError: () => {
      toast.error("Failed to remove candidate");
    },
  });

  const updateMutation = trpc.talentPool.update.useMutation({
    onSuccess: () => {
      utils.talentPool.list.invalidate();
      setEditingEntry(null);
      toast.success("Talent pool entry updated");
    },
    onError: () => {
      toast.error("Failed to update entry");
    },
  });

  const handleRemove = (candidateId: number) => {
    if (!employer?.id) return;
    removeMutation.mutate({
      employerId: employer.id,
      candidateId,
    });
  };

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setEditNotes(entry.talentPoolEntry.notes || "");
    setEditTags((entry.talentPoolEntry.tags || []).join(", "));
    setEditStatus(entry.talentPoolEntry.status);
  };

  const handleUpdate = () => {
    if (!employer?.id || !editingEntry) return;
    
    updateMutation.mutate({
      employerId: employer.id,
      candidateId: editingEntry.candidate.id,
      notes: editNotes || undefined,
      tags: editTags ? editTags.split(",").map((t: any) => t.trim()).filter(Boolean) : undefined,
      status: editStatus,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500';
      case 'contacted': return 'bg-yellow-500';
      case 'hired': return 'bg-green-500';
      case 'not_interested': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading talent pool...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Talent Pool</h1>
            <p className="text-muted-foreground">
              Promising candidates saved for future opportunities
            </p>
          </div>
        </div>

        {!talentPool || talentPool.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No candidates in talent pool</h3>
              <p className="text-muted-foreground mb-4">
                Save promising candidates from job applications to build your talent pool
              </p>
              <Button onClick={() => setLocation("/employer/applications")}>
                View Applications
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {talentPool.map(({ talentPoolEntry, candidate }) => (
              <Card key={talentPoolEntry.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{candidate.fullName}</CardTitle>
                      <CardDescription>{candidate.headline || candidate.email}</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit({ talentPoolEntry, candidate })}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(candidate.id)}
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(talentPoolEntry.status)}>
                        {talentPoolEntry.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {talentPoolEntry.matchScore && (
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{talentPoolEntry.matchScore}% Match</span>
                        </div>
                      )}
                    </div>

                    {talentPoolEntry.tags && talentPoolEntry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {talentPoolEntry.tags.map((tag: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {talentPoolEntry.notes && (
                      <div className="p-2 bg-muted rounded text-sm">
                        {talentPoolEntry.notes}
                      </div>
                    )}

                    {candidate.location && (
                      <p className="text-sm text-muted-foreground">📍 {candidate.location}</p>
                    )}

                    {candidate.yearsOfExperience && (
                      <p className="text-sm text-muted-foreground">
                        💼 {candidate.yearsOfExperience} years experience
                      </p>
                    )}

                    <div className="pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          window.location.href = `mailto:${candidate.email}`;
                        }}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Contact Candidate
                      </Button>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Added {new Date(talentPoolEntry.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Talent Pool Entry</DialogTitle>
              <DialogDescription>
                Update notes, tags, and status for {editingEntry?.candidate.fullName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={editStatus} onValueChange={(v: any) => setEditStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                    <SelectItem value="not_interested">Not Interested</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Tags (comma-separated)</label>
                <Input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="e.g., senior, frontend, react"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Notes</label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes about this candidate..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingEntry(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
