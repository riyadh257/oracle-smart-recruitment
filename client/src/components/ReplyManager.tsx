import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Mail, TrendingUp, TrendingDown, MessageCircle, AlertCircle, Smile, Meh, Frown } from "lucide-react";

export default function ReplyManager() {
  const [replyTypeFilter, setReplyTypeFilter] = useState<string>("all");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");

  const { data: stats, isLoading: statsLoading } = trpc.replies.getStats.useQuery();
  const { data: replies, isLoading: repliesLoading } = trpc.replies.getAll.useQuery({
    replyType: replyTypeFilter !== "all" ? (replyTypeFilter as any) : undefined,
    sentiment: sentimentFilter !== "all" ? (sentimentFilter as any) : undefined,
    limit: 50,
  });

  const getReplyTypeBadge = (type: string) => {
    const config: Record<string, { variant: any; label: string; icon: any }> = {
      positive: { variant: "default", label: "Positive", icon: TrendingUp },
      negative: { variant: "destructive", label: "Negative", icon: TrendingDown },
      neutral: { variant: "secondary", label: "Neutral", icon: Meh },
      question: { variant: "outline", label: "Question", icon: MessageCircle },
      out_of_office: { variant: "secondary", label: "Out of Office", icon: Mail },
      unsubscribe: { variant: "destructive", label: "Unsubscribe", icon: AlertCircle },
    };
    return config[type] || config.neutral;
  };

  const getSentimentIcon = (sentiment: string) => {
    if (sentiment.includes("positive")) return <Smile className="h-4 w-4 text-green-600" />;
    if (sentiment.includes("negative")) return <Frown className="h-4 w-4 text-red-600" />;
    return <Meh className="h-4 w-4 text-slate-400" />;
  };

  const getSentimentColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-slate-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Email Reply Management</h2>
        <p className="text-sm text-muted-foreground">
          Track and analyze candidate email responses
        </p>
      </div>

      {/* Stats Overview */}
      {statsLoading ? null : stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Replies</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReplies}</div>
              <p className="text-xs text-muted-foreground">
                {stats.recentReplies} in last 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Positive Replies</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.positiveReplies}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalReplies > 0 ? Math.round((stats.positiveReplies / stats.totalReplies) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Questions</CardTitle>
              <MessageCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.questions}</div>
              <p className="text-xs text-muted-foreground">
                Require follow-up
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Sentiment</CardTitle>
              <Smile className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getSentimentColor(stats.avgSentimentScore)}`}>
                {Math.round(stats.avgSentimentScore)}
              </div>
              <p className="text-xs text-muted-foreground">
                Out of 100
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Replies Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Replies</CardTitle>
              <CardDescription>Candidate email responses with AI analysis</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={replyTypeFilter} onValueChange={setReplyTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Reply Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="question">Questions</SelectItem>
                  <SelectItem value="out_of_office">Out of Office</SelectItem>
                  <SelectItem value="unsubscribe">Unsubscribe</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sentiment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sentiments</SelectItem>
                  <SelectItem value="very_positive">Very Positive</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="very_negative">Very Negative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {repliesLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : replies && replies.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Sentiment</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Keywords</TableHead>
                  <TableHead>Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {replies.map((reply: any) => {
                  const typeBadge = getReplyTypeBadge(reply.replyType);
                  const TypeIcon = typeBadge.icon;
                  return (
                    <TableRow key={reply.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{reply.candidateName}</p>
                          <p className="text-xs text-muted-foreground">{reply.candidateEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="max-w-xs truncate">{reply.subject}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={typeBadge.variant}>
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {typeBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getSentimentIcon(reply.sentiment)}
                          <span className="text-sm capitalize">{reply.sentiment.replace("_", " ")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold ${getSentimentColor(reply.sentimentScore)}`}>
                          {reply.sentimentScore}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {reply.keywords.slice(0, 3).map((keyword: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {new Date(reply.receivedAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(reply.receivedAt).toLocaleTimeString()}
                        </p>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-12">
              <Mail className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-muted-foreground">No replies received yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
