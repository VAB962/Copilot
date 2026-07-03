'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Repository, Analysis, Notification } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  GitBranch,
  Shield,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowRight,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

interface DashboardStats {
  totalRepositories: number;
  totalAnalyses: number;
  criticalIssues: number;
  overallScore: number | null;
}

const scoreColors: Record<string, string> = {
  high: 'hsl(var(--chart-2))',
  medium: 'hsl(var(--chart-3))',
  low: 'hsl(var(--chart-4))',
};

const severityColors: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
  info: '#3b82f6',
};

const activityData = [
  { day: 'Mon', analyses: 12, issues: 45 },
  { day: 'Tue', analyses: 19, issues: 32 },
  { day: 'Wed', analyses: 8, issues: 67 },
  { day: 'Thu', analyses: 15, issues: 28 },
  { day: 'Fri', analyses: 22, issues: 54 },
  { day: 'Sat', analyses: 10, issues: 15 },
  { day: 'Sun', analyses: 5, issues: 0 },
];

const categoryData = [
  { name: 'Security', value: 35, color: '#ef4444' },
  { name: 'Performance', value: 25, color: '#f97316' },
  { name: 'Maintainability', value: 20, color: '#eab308' },
  { name: 'Bug Risk', value: 15, color: '#3b82f6' },
  { name: 'Style', value: 5, color: '#22c55e' },
];

export default function DashboardPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalRepositories: 0,
    totalAnalyses: 0,
    criticalIssues: 0,
    overallScore: null,
  });
  const [recentRepositories, setRecentRepositories] = useState<Repository[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<(Analysis & { repositories?: Repository })[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [reposRes, analysesRes, issuesRes, notifRes] = await Promise.all([
          supabase
            .from('repositories')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('analyses')
            .select('*, repositories(*)')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('issues')
            .select('id')
            .eq('severity', 'critical'),
          supabase
            .from('notifications')
            .select('*')
            .eq('read', false)
            .order('created_at', { ascending: false })
            .limit(5),
        ]);

        const totalRepos = await supabase.from('repositories').select('id', { count: 'exact', head: true });
        const totalAnalyses = await supabase.from('analyses').select('id', { count: 'exact', head: true });

        let avgScore = null;
        if (analysesRes.data && analysesRes.data.length > 0) {
          const scores = analysesRes.data
            .filter((a) => a.overall_score !== null)
            .map((a) => a.overall_score);
          if (scores.length > 0) {
            avgScore = scores.reduce((a, b) => a! + b!, 0)! / scores.length;
          }
        }

        setStats({
          totalRepositories: totalRepos.count || 0,
          totalAnalyses: totalAnalyses.count || 0,
          criticalIssues: issuesRes.count || 0,
          overallScore: avgScore,
        });
        setRecentRepositories(reposRes.data || []);
        setRecentAnalyses(analysesRes.data || []);
        setNotifications(notifRes.data || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreLabel = (score: number | null) => {
    if (score === null) return 'N/A';
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Developer'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your repositories today.
          </p>
        </div>
        <Link href="/dashboard/repositories/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Repository
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repositories</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRepositories}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/dashboard/repositories" className="text-primary hover:underline">
                View all
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analyses Run</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAnalyses}</div>
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              +12% from last week
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.criticalIssues}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(stats.overallScore)}`}>
              {stats.overallScore !== null ? `${stats.overallScore.toFixed(1)}` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{getScoreLabel(stats.overallScore)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>Analyses and issues detected this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="colorAnalyses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="analyses"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorAnalyses)"
                  />
                  <Area
                    type="monotone"
                    dataKey="issues"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorIssues)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Issue Categories Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Issue Categories</CardTitle>
            <CardDescription>Distribution of detected issues by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {categoryData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Repositories */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Repositories</CardTitle>
                <CardDescription>Your recently added repositories</CardDescription>
              </div>
              <Link href="/dashboard/repositories">
                <Button variant="ghost" size="sm">
                  View all
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentRepositories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No repositories yet</p>
                <Link href="/dashboard/repositories/new">
                  <Button variant="link" className="mt-2">
                    Add your first repository
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentRepositories.map((repo) => (
                  <Link
                    key={repo.id}
                    href={`/dashboard/repositories/${repo.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <GitBranch className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{repo.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {repo.language || 'Unknown'} • {repo.status}
                      </p>
                    </div>
                    <Badge
                      variant={repo.status === 'completed' ? 'default' : repo.status === 'analyzing' ? 'secondary' : 'outline'}
                    >
                      {repo.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Recent updates and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>All caught up!</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <p className="text-sm font-medium">{notif.title}</p>
                      {notif.message && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notif.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(notif.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
