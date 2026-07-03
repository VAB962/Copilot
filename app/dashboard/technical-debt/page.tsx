'use client';

import { useState, useEffect } from 'react';
import { supabase, Repository, Analysis, Issue } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Wrench,
  AlertCircle,
  Loader2,
  Code,
  FileText,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';

export default function TechnicalDebtPage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchRepositories();
  }, []);

  useEffect(() => {
    if (selectedRepo) {
      fetchDebtData(selectedRepo);
    }
  }, [selectedRepo]);

  const fetchRepositories = async () => {
    try {
      const { data, error } = await supabase
        .from('repositories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRepositories(data || []);
      if (data && data.length > 0) {
        setSelectedRepo(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDebtData = async (repoId: string) => {
    try {
      const { data: analyses } = await supabase
        .from('analyses')
        .select('*')
        .eq('repository_id', repoId)
        .eq('type', 'debt')
        .order('created_at', { ascending: false })
        .limit(1);

      if (analyses && analyses.length > 0) {
        setAnalysis(analyses[0]);
        const { data: issuesData } = await supabase
          .from('issues')
          .select('*')
          .eq('analysis_id', analyses[0].id)
          .in('category', ['maintainability', 'style']);

        setIssues(issuesData || []);
      } else {
        setAnalysis(null);
        setIssues([]);
      }
    } catch (error) {
      console.error('Error fetching debt data:', error);
    }
  };

  const runDebtAnalysis = async () => {
    if (!selectedRepo) return;

    setAnalyzing(true);

    try {
      const { data: newAnalysis, error } = await supabase
        .from('analyses')
        .insert({
          repository_id: selectedRepo,
          type: 'debt',
          status: 'processing',
        })
        .select()
        .single();

      if (error) throw error;

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const scores = {
        overall_score: Math.floor(Math.random() * 30) + 60,
        maintainability_score: Math.floor(Math.random() * 30) + 60,
        debt_score: Math.floor(Math.random() * 30) + 40,
      };

      await supabase
        .from('analyses')
        .update({
          status: 'completed',
          ...scores,
          completed_at: new Date().toISOString(),
        })
        .eq('id', newAnalysis.id);

      const sampleIssues = [
        {
          analysis_id: newAnalysis.id,
          repository_id: selectedRepo,
          file_path: '/src/utils/helpers.ts',
          line_start: 45,
          severity: 'medium' as const,
          category: 'maintainability' as const,
          title: 'Long Function Detected',
          description: 'Function processUserData exceeds 80 lines',
          suggestion: 'Consider breaking into smaller, focused functions',
        },
        {
          analysis_id: newAnalysis.id,
          repository_id: selectedRepo,
          file_path: '/src/components/dashboard.tsx',
          line_start: 120,
          severity: 'high' as const,
          category: 'maintainability' as const,
          title: 'Large Component',
          description: 'Component exceeds 300 lines of code',
          suggestion: 'Split into smaller, reusable components',
        },
        {
          analysis_id: newAnalysis.id,
          repository_id: selectedRepo,
          file_path: '/src/api/handlers.ts',
          line_start: 67,
          severity: 'low' as const,
          category: 'style' as const,
          title: 'Inconsistent Naming Convention',
          description: 'Mix of camelCase and snake_case in variable names',
          suggestion: 'Standardize to camelCase for consistency',
        },
      ];

      await supabase.from('issues').insert(sampleIssues);

      await fetchDebtData(selectedRepo);
    } catch (error) {
      console.error('Error running debt analysis:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const radarData = analysis
    ? [
        { metric: 'Code Complexity', value: analysis.overall_score || 0 },
        { metric: 'Duplication', value: Math.floor(Math.random() * 20) + 70 },
        { metric: 'Test Coverage', value: Math.floor(Math.random() * 30) + 50 },
        { metric: 'Documentation', value: Math.floor(Math.random() * 40) + 40 },
        { metric: 'Naming', value: Math.floor(Math.random() * 20) + 70 },
        { metric: 'Function Size', value: Math.floor(Math.random() * 30) + 60 },
      ]
    : [];

  const barData = [
    { name: 'Code Smells', count: Math.floor(Math.random() * 20) + 5 },
    { name: 'Duplication', count: Math.floor(Math.random() * 10) + 2 },
    { name: 'Complex Methods', count: Math.floor(Math.random() * 15) + 3 },
    { name: 'Long Files', count: Math.floor(Math.random() * 8) + 1 },
    { name: 'Dead Code', count: Math.floor(Math.random() * 12) + 4 },
  ];

  const getDebtLevel = (score: number | null) => {
    if (score === null) return 'Not Analyzed';
    if (score >= 80) return 'Low Debt';
    if (score >= 60) return 'Moderate Debt';
    return 'High Debt';
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Technical Debt Analyzer</h1>
          <p className="text-muted-foreground mt-1">
            Measure code quality and identify areas for improvement
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedRepo} onValueChange={setSelectedRepo}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select repository" />
            </SelectTrigger>
            <SelectContent>
              {repositories.map((repo) => (
                <SelectItem key={repo.id} value={repo.id}>
                  {repo.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={runDebtAnalysis} disabled={analyzing || !selectedRepo}>
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4 mr-2" />
                Analyze Debt
              </>
            )}
          </Button>
        </div>
      </div>

      {selectedRepo ? (
        analysis ? (
          <>
            {/* Score Overview */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="stat-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Debt Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${getScoreColor(analysis.debt_score)}`}>
                    {analysis.debt_score?.toFixed(0) || '--'}
                  </div>
                  <Badge variant={analysis.debt_score && analysis.debt_score >= 60 ? 'default' : 'destructive'} className="mt-2">
                    {getDebtLevel(analysis.debt_score)}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="stat-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Maintainability</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${getScoreColor(analysis.maintainability_score)}`}>
                    {analysis.maintainability_score?.toFixed(0) || '--'}
                  </div>
                  <Progress value={analysis.maintainability_score || 0} className="mt-2 h-2" />
                </CardContent>
              </Card>

              <Card className="stat-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Est. Refactor Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {Math.floor(Math.random() * 20) + 5}h
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Estimated effort</p>
                </CardContent>
              </Card>

              <Card className="stat-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    <Wrench className="w-4 h-4" />
                    Items to Fix
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{issues.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Across {issues.length} files</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Code Quality Metrics</CardTitle>
                  <CardDescription>Analysis across different quality dimensions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" className="text-xs" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar
                          name="Score"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.5}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Debt Categories</CardTitle>
                  <CardDescription>Types of technical debt identified</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Issues List */}
            <Card>
              <CardHeader>
                <CardTitle>Refactoring Recommendations</CardTitle>
                <CardDescription>Prioritized list of improvements</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {issues.map((issue) => (
                      <div
                        key={issue.id}
                        className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={issue.severity === 'high' ? 'destructive' : 'outline'}>
                                {issue.severity}
                              </Badge>
                              <span className="text-sm text-muted-foreground">{issue.file_path}</span>
                            </div>
                            <h4 className="font-medium">{issue.title}</h4>
                            {issue.description && (
                              <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                            )}
                            {issue.suggestion && (
                              <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                                Suggestion: {issue.suggestion}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              Est. {Math.floor(Math.random() * 4) + 1}h
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BarChart3 className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No debt analysis yet</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Run a debt analysis to measure code quality and identify areas for improvement.
              </p>
              <Button onClick={runDebtAnalysis} disabled={analyzing}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Run Debt Analysis
              </Button>
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Select a repository</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Choose a repository to analyze for technical debt.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
