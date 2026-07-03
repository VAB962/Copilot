'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase, ChatSession, ChatMessage, Repository } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MessageSquare,
  Send,
  Loader2,
  Plus,
  User,
  Bot,
  Code,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const suggestedQuestions = [
  'Explain the authentication flow',
  'Show me the database schema',
  'Find potential security issues',
  'How does error handling work?',
  'Suggest code improvements',
  'Generate unit tests',
];

export default function ChatPage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRepositories();
  }, []);

  useEffect(() => {
    if (currentSession) {
      fetchMessages(currentSession.id);
    }
  }, [currentSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchRepositories = async () => {
    try {
      const [{ data: repos }, { data: sess }] = await Promise.all([
        supabase.from('repositories').select('*').order('created_at', { ascending: false }),
        supabase.from('chat_sessions').select('*').order('updated_at', { ascending: false }),
      ]);

      setRepositories(repos || []);
      setSessions(sess || []);
      if (sess && sess.length > 0) {
        setCurrentSession(sess[0]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const createNewSession = async () => {
    const title = `Chat ${new Date().toLocaleDateString()}`;
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ title })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create chat session');
      return;
    }

    if (data) {
      setSessions([data, ...sessions]);
      setCurrentSession(data);
      setMessages([]);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await supabase.from('chat_sessions').delete().eq('id', sessionId);
      setSessions(sessions.filter((s) => s.id !== sessionId));
      if (currentSession?.id === sessionId) {
        setCurrentSession(sessions.length > 1 ? sessions.find((s) => s.id !== sessionId) || null : null);
        setMessages([]);
      }
      toast.success('Chat deleted');
    } catch (error) {
      toast.error('Failed to delete chat');
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentSession) return;

    const userMessage = input.trim();
    setInput('');
    setSending(true);

    try {
      const { error: msgError } = await supabase.from('chat_messages').insert({
        session_id: currentSession.id,
        role: 'user',
        content: userMessage,
      });

      if (msgError) throw msgError;

      const newUserMsg = {
        id: 'temp-user',
        session_id: currentSession.id,
        role: 'user' as const,
        content: userMessage,
        created_at: new Date().toISOString(),
      };
      setMessages([...messages, newUserMsg]);

      // Simulate AI response
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const aiResponses = [
        `I analyzed your codebase. Here's what I found regarding "${userMessage}":

**Key Findings:**
- The authentication uses JWT tokens stored in httpOnly cookies
- Password hashing uses bcrypt with salt rounds of 10
- Session management includes token refresh logic

**Suggestions:**
1. Consider adding rate limiting to login endpoints
2. Implement CSRF protection for form submissions
3. Add password strength validation

Would you like me to explain any specific part in detail?`,
        `Based on my analysis of the repository structure:

**Architecture Overview:**
- Frontend: React with TypeScript
- Backend: Node.js with Express
- Database: PostgreSQL with Prisma ORM

**Database Schema:**
- Users table with authentication fields
- Project and Task tables with relations
- Audit log for tracking changes

Shall I generate UML diagrams or detailed documentation?`,
      ];

      const aiResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];

      const { data: savedMsg } = await supabase
        .from('chat_messages')
        .insert({
          session_id: currentSession.id,
          role: 'assistant',
          content: aiResponse,
        })
        .select()
        .single();

      if (savedMsg) {
        setMessages([...messages, newUserMsg, savedMsg]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSuggestion = (question: string) => {
    setInput(question);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Sidebar */}
      <Card className="w-64 shrink-0 flex flex-col">
        <CardHeader className="border-b py-4">
          <Button onClick={createNewSession} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </CardHeader>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setCurrentSession(session)}
                className={cn(
                  'w-full text-left p-3 rounded-lg text-sm transition-colors',
                  currentSession?.id === session.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{session.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-6 w-6',
                      currentSession?.id === session.id
                        ? 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'
                        : ''
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            <CardHeader className="border-b py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{currentSession.title}</CardTitle>
                {repositories.length > 0 && (
                  <Select
                    value={currentSession.repository_id || ''}
                    onValueChange={async (value) => {
                      const { error } = await supabase
                        .from('chat_sessions')
                        .update({ repository_id: value || null })
                        .eq('id', currentSession.id);
                      if (!error) {
                        setCurrentSession({ ...currentSession, repository_id: value || null });
                      }
                    }}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Link repository..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {repositories.map((repo) => (
                        <SelectItem key={repo.id} value={repo.id}>
                          {repo.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Start chatting with AI</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ask questions about your codebase
                  </p>
                  <div className="flex flex-wrap gap-2 max-w-md">
                    {suggestedQuestions.map((question) => (
                      <Button
                        key={question}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestion(question)}
                        className="text-xs"
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex gap-3',
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'rounded-lg p-3 max-w-[80%]',
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your code..."
                  disabled={sending}
                  className="flex-1"
                />
                <Button type="submit" disabled={sending || !input.trim()}>
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <CardContent className="h-full flex flex-col items-center justify-center">
            <MessageSquare className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No chat selected</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start a new chat to begin
            </p>
            <Button onClick={createNewSession}>
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
