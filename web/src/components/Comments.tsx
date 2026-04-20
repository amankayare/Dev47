import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Reply, 
  User, 
  Calendar, 
  LogIn, 
  UserPlus,
  Send,
  ChevronDown,
  ChevronUp 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: number;
  content: string;
  author: {
    id: number;
    username: string;
    is_admin: boolean;
  };
  created_at: string;
  updated_at: string;
  parent_id: number | null;
  replies?: Comment[];
}

interface CommentsProps {
  blogId: number;
}

export default function Comments({ blogId }: CommentsProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      try {
        setCurrentUser(JSON.parse(user));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ['comments', blogId],
    queryFn: async () => {
      const response = await fetch(`/api/blogs/${blogId}/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      return response.json();
    },
    enabled: !!blogId,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: number }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/blogs/${blogId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content,
          parent_id: parentId || null,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add comment');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', blogId] });
      setNewComment('');
      setReplyContent('');
      setReplyTo(null);
      toast({
        title: "Comment added successfully",
        description: "Your comment has been posted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding comment",
        description: "Failed to post your comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to post a comment.",
        variant: "destructive",
      });
      return;
    }
    
    if (!newComment.trim()) {
      toast({
        title: "Comment required",
        description: "Please enter a comment before submitting.",
        variant: "destructive",
      });
      return;
    }

    addCommentMutation.mutate({ content: newComment.trim() });
  };

  const handleSubmitReply = (e: React.FormEvent, parentId: number) => {
    e.preventDefault();
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to reply to comments.",
        variant: "destructive",
      });
      return;
    }
    
    if (!replyContent.trim()) {
      toast({
        title: "Reply required",
        description: "Please enter a reply before submitting.",
        variant: "destructive",
      });
      return;
    }

    addCommentMutation.mutate({ content: replyContent.trim(), parentId });
  };

  const toggleCommentExpansion = (commentId: number) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderComment = (comment: Comment, level: number = 0) => {
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isExpanded = expandedComments.has(comment.id);

    return (
      <div key={comment.id} className={`${level > 0 ? 'ml-8 border-l-2 border-muted pl-4' : ''}`}>
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {comment.author.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{comment.author.username}</span>
                  {comment.author.is_admin && (
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      Admin
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {formatDate(comment.created_at)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm leading-relaxed mb-3">{comment.content}</p>
            <div className="flex items-center gap-2">
              {currentUser && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                  className="h-7 px-2 text-xs"
                >
                  <Reply className="w-3 h-3 mr-1" />
                  Reply
                </Button>
              )}
              {hasReplies && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCommentExpansion(comment.id)}
                  className="h-7 px-2 text-xs"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-3 h-3 mr-1" />
                  ) : (
                    <ChevronDown className="w-3 h-3 mr-1" />
                  )}
                  {comment.replies?.length} {comment.replies?.length === 1 ? 'Reply' : 'Replies'}
                </Button>
              )}
            </div>

            {/* Reply Form */}
            {replyTo === comment.id && (
              <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="mt-4 p-4 bg-muted/20 rounded-lg">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Reply to ${comment.author.username}...`}
                  className="min-h-[80px] mb-3"
                />
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={addCommentMutation.isPending}
                    variant="default"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    <Send className="w-3 h-3 mr-1" />
                    {addCommentMutation.isPending ? 'Posting...' : 'Post Reply'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setReplyTo(null);
                      setReplyContent('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Nested Replies */}
        {hasReplies && isExpanded && (
          <div className="ml-4">
            {comment.replies?.map((reply) => renderComment(reply, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-12">
      <Separator className="mb-8" />
      
      {/* Comments Header */}
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h3 className="text-xl font-semibold">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h3>
      </div>

      {/* Add Comment Form */}
      {currentUser ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Add a Comment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitComment}>
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this blog post..."
                className="min-h-[120px] mb-4"
              />
              <Button 
                type="submit" 
                disabled={addCommentMutation.isPending}
                variant="default"
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <Send className="w-4 h-4" />
                {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8 border-dashed">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-medium mb-2">Join the Discussion</h4>
              <p className="text-muted-foreground mb-4">
                Log in to share your thoughts and engage with other readers.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="default"
                  onClick={() => setLocation('/login')}
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation('/register')}
                  className="gap-2 text-foreground border-border hover:bg-muted/50 hover:text-foreground"
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full" />
                  <div className="w-24 h-4 bg-muted rounded" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="w-full h-4 bg-muted rounded" />
                  <div className="w-3/4 h-4 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div>
          {comments
            .filter(comment => !comment.parent_id) // Only show top-level comments
            .map((comment) => renderComment(comment))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-medium mb-2">No Comments Yet</h4>
              <p className="text-muted-foreground">
                Be the first to share your thoughts about this blog post!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
