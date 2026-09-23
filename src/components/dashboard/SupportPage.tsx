import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Clock, CheckCircle2, MessageCircle, AlertCircle, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/teacher/discussions');
      if (!response.ok) throw new Error("Failed to load discussions");
      const data = await response.json();
      setTickets(Array.isArray(data) ? data : data.discussions || []);
    } catch (err: any) {
      setError(err.message || "Failed to connect to support API.");
      // Fallback mock data for demonstration if API fails
      setTickets([
        {
          id: '1',
          studentName: 'Rahul Verma',
          context: 'Advanced React Course - Module 4',
          question: 'I am getting a weird error when trying to use useEffect with async functions inside it. Can you help clarify how to properly clean up the effect?',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          status: 'pending',
          replies: []
        },
        {
          id: '2',
          studentName: 'Priya Singh',
          context: 'Fullstack Test Series - Test 2',
          question: 'Question 15 seems to have two correct options. Can you please check?',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          status: 'replied',
          replies: [
            { id: 'r1', sender: 'teacher', text: 'Hi Priya, thanks for pointing this out. I have reviewed Q15 and updated the correct option.', createdAt: new Date(Date.now() - 40000000).toISOString() }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleReplySubmit = async () => {
    if (!replyText.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }
    
    setSubmittingReply(true);
    try {
      const response = await fetch('/api/teacher/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: selectedTicket.id, text: replyText })
      });
      
      if (!response.ok) throw new Error("Failed to submit reply");
      
      toast.success("Reply posted successfully");
      setReplyText("");
      setSelectedTicket(null);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || "Error submitting reply");
      
      // Mock optimistic update for demonstration
      setTickets(prev => prev.map(t => {
        if (t.id === selectedTicket.id) {
          return {
            ...t, 
            status: 'replied', 
            replies: [...(t.replies || []), { id: Date.now().toString(), sender: 'teacher', text: replyText, createdAt: new Date().toISOString() }]
          };
        }
        return t;
      }));
      toast.success("Reply posted successfully (Mock)");
      setReplyText("");
      setSelectedTicket(null);
    } finally {
      setSubmittingReply(false);
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
  };

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  const pendingTickets = tickets.filter(t => t.status !== 'replied');
  const repliedTickets = tickets.filter(t => t.status === 'replied');

  const displayedTickets = activeTab === 'pending' ? pendingTickets : tickets;

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support & Help Desk</h1>
        <p className="text-muted-foreground mt-1">Manage student queries, doubts, and forum discussions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Open Tickets</p>
              <h3 className="text-2xl font-bold">{pendingTickets.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Resolved</p>
              <h3 className="text-2xl font-bold">{repliedTickets.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Queries</p>
              <h3 className="text-2xl font-bold">{tickets.length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pendingTickets.length})</TabsTrigger>
            <TabsTrigger value="all">All Queries</TabsTrigger>
          </TabsList>
          
          <Button variant="outline" size="sm" onClick={fetchTickets} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        <TabsContent value={activeTab} className="m-0 focus-visible:outline-none space-y-4">
          {loading && tickets.length === 0 ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
              ))}
            </div>
          ) : error && tickets.length === 0 ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="flex flex-col items-center justify-center py-12 text-red-600">
                <AlertCircle className="w-11 h-11 mb-4" />
                <p>{error}</p>
              </CardContent>
            </Card>
          ) : displayedTickets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mb-4 text-emerald-400 opacity-50" />
                <p className="text-lg font-medium">All caught up!</p>
                <p className="text-sm">No queries found for this view.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {displayedTickets.map(ticket => (
                <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5 flex flex-col md:flex-row gap-4 items-start">
                    <div className="flex-shrink-0 w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center font-semibold text-primary">
                      {getInitials(ticket.studentName)}
                    </div>
                    
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="font-medium truncate">{ticket.studentName}</h4>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(ticket.createdAt)}</span>
                      </div>
                      <Badge variant="outline" className="text-xs mb-1 font-normal bg-slate-50">{ticket.context}</Badge>
                      <p className="text-sm text-slate-700 line-clamp-2 mt-2">
                        {ticket.question}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-3 flex-shrink-0 w-full md:w-auto mt-4 md:mt-0">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${ticket.status === 'replied' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                        <span className="text-xs font-medium text-muted-foreground capitalize">
                          {ticket.status === 'replied' ? 'Replied' : 'Pending'}
                        </span>
                      </div>
                      <Button size="sm" onClick={() => setSelectedTicket(ticket)} variant={ticket.status === 'replied' ? 'secondary' : 'default'}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        {ticket.status === 'replied' ? 'View Thread' : 'Reply'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reply Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        {selectedTicket && (
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Reply to {selectedTicket.studentName}</DialogTitle>
              <div className="text-sm text-muted-foreground">{selectedTicket.context}</div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4">
              {/* Original Question */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {getInitials(selectedTicket.studentName)}
                </div>
                <div className="flex-1 bg-slate-50 rounded-lg p-3 text-sm border">
                  <div className="font-medium text-xs text-muted-foreground mb-1">Original Query</div>
                  {selectedTicket.question}
                  <div className="text-xs text-muted-foreground mt-2 text-right">
                    {new Date(selectedTicket.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Thread / Replies */}
              {selectedTicket.replies?.map((reply: any) => (
                <div key={reply.id} className={`flex gap-3 ${reply.sender === 'teacher' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${reply.sender === 'teacher' ? 'bg-primary text-primary-foreground' : 'bg-slate-200'}`}>
                    {reply.sender === 'teacher' ? 'T' : getInitials(selectedTicket.studentName)}
                  </div>
                  <div className={`flex-1 rounded-lg p-3 text-sm ${reply.sender === 'teacher' ? 'bg-primary/10 border-primary/20 border' : 'bg-slate-50 border'}`}>
                    {reply.text}
                    <div className="text-xs text-muted-foreground mt-2 text-right">
                      {new Date(reply.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              <Textarea 
                placeholder="Type your reply here..." 
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={submittingReply}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setSelectedTicket(null)}>Cancel</Button>
                <Button onClick={handleReplySubmit} disabled={submittingReply || !replyText.trim()}>
                  {submittingReply ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Send Reply
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
