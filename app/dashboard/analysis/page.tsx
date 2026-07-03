'use client';

import { useState, useEffect } from 'react';
import { supabase, Repository, Analysis, Issue } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  Shield,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  FileText,
  Layers,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const severityColors: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
  info: '#3b82f6',
};

const categoryColors: Record<string, string> = {
  security: '#ef4444',
  performance: '#f97316',
  maintainability: '#eab308',
  bug_risk: '#3b82f6',
  style: '#22c55e',
};

export default function AnalysisPage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchRepositories();
  }, []);

  useEffect(() => {
    if (selectedRepo) {
      fetchAnalyses(selectedRepo);
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

  const fetchAnalyses = async (repoId: string) => {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('repository_id', repoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
      if (data && data.length > 0) {
        setCurrentAnalysis(data[0]);
        fetchIssues(data[0].id);
      } else {
        setCurrentAnalysis(null);
        setIssues([]);
      }
    } catch (error) {
      console.error('Error fetching analyses:', error);
    }
  };

  const fetchIssues = async (analysisId: string) => {
    try {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('severity', { ascending: true });

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      console.error('Error fetching issues:', error);
    }
  };

  const startAnalysis = async (type: 'full' | 'security' | 'architecture' | 'performance' | 'debt' = 'full') => {
    if (!selectedRepo) return;

    setAnalyzing(true);

    try {
      const { data, error } = await supabase
        .from('analyses')
        .insert({
          repository_id: selectedRepo,
          type,
          status: 'processing',
        })
        .select()
        .single();

      if (error) throw error;

      // Simulate analysis progress
      const analysisId = data.id;
      let progress = 0;

      // Update status to completed after simulation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const scores = {
        overall_score: Math.floor(Math.random() * 30) + 60,
        security_score: Math.floor(Math.random() * 30) + 60,
        maintainability_score: Math.floor(Math.random() * 30) + 60,
        performance_score: Math.floor(Math.random() * 30) + 60,
        debt_score: Math.floor(Math.random() * 30) + 40,
      };

      const { error: updateError } = await supabase
        .from('analyses')
        .update({
          status: 'completed',
          ...scores,
          completed_at: new Date().toISOString(),
        })
        .eq('id', analysisId);

      if (updateError) throw updateError;

      // Generate some sample issues
      const sampleIssues = generateSampleIssues(analysisId, selectedRepo);
      const { error: issuesError } = await supabase
        .from('issues')
        .insert(sampleIssues);

      if (issuesError) throw issuesError;

      await fetchAnalyses(selectedRepo);
    } catch (error) {
      console.error('Error starting analysis:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const generateSampleIssues = (analysisId: string, repoId: string): Partial<Issue>[] => {
    const issueTemplates: Array<{
      title: string;
      category: 'security' | 'performance' | 'maintainability' | 'bug_risk' | 'style';
      severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
      file_path: string;
      line_start: number;
      description: string;
    }> = [
      { title: 'Hardcoded API key detected', category: 'security', severity: 'critical', file_path: '/src/config/api.ts', line_start: 42, description: 'API key exposed in source code' },
      { title: 'Unused import statement', category: 'style', severity: 'low', file_path: '/src/utils/helper.ts', line_start: 15, description: 'Import is never used' },
      { title: 'Missing input validation', category: 'security', severity: 'high', file_path: '/src/api/auth.ts', line_start: 88, description: 'User input not properly sanitized' },
      { title: 'Long function detected', category: 'maintainability', severity: 'medium', file_path: '/src/services/data.ts', line_start: 120, description: 'Function exceeds 50 lines' },
      { title: 'Potential memory leak', category: 'performance', severity: 'high', file_path: '/src/components/chart.tsx', line_start: 45, description: 'Event listener not cleaned up' },
      { title: 'SQL injection vulnerability', category: 'security', severity: 'critical', file_path: '/src/db/queries.ts', line_start: 67, description: 'String concatenation in SQL query' },
    ];

    return issueTemplates.map(issue => ({
      analysis_id: analysisId,
      repository_id: repoId,
      ...issue,
      suggestion: 'Recommend refactoring for better code quality',
    }));
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreProgressColor = (score: number | null) => {
    if (score === null) return 'bg-gray-300';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const issuesByCategory = issues.reduce((acc, issue) => {
    acc[issue.category] = (acc[issue.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(issuesByCategory).map(([name, value]) => ({
    name,
    value,
    color: categoryColors[name] || '#888',
  }));

  const issuesBySeverity = issues.reduce((acc, issue) => {
    acc[issue.severity] = (acc[issue.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
          <h1 className="text-3xl font-bold">AI Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Analyze your code for quality, security, and performance issues
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
          <Button onClick={() => startAnalysis('full')} disabled={analyzing || !selectedRepo}>
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 mr-2" />
                Run Analysis
              </>
            )}
          </Button>
        </div>
      </div>

      {selectedRepo ? (
        currentAnalysis ? (
          <>
            {/* Score Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card className="stat-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Overall</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getScoreColor(currentAnalysis.overall_score)}`}>
                    {currentAnalysis.overall_score?.toFixed(0) || 'N/A'}
                  </div>
                  <Progress
                    value={currentAnalysis.overall_score || 0}
                    className="mt-2 h-2"
                  />
                </CardContent>
              </Card>
              <Card className="stat-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    Security
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getScoreColor(currentAnalysis.security_score)}`}>
                    {currentAnalysis.security_score?.toFixed(0) || 'N/A'}
                  </div>
                  <Progress
                    value={currentAnalysis.security_score || 0}
                    className="mt-2 h-2"
                  />
                </CardContent>
              </Card>
              <Card className="stat-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    <Layers className="w-4 h-4" />
                    Maintainability
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getScoreColor(currentAnalysis.maintainability_score)}`}>
                    {currentAnalysis.maintainability_score?.toFixed(0) || 'N/A'}
                  </div>
                  <Progress
                    value={currentAnalysis.maintainability_score || 0}
                    className="mt-2 h-2"
                  />
                </CardContent>
              </Card>
              <Card className="stat-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getScoreColor(currentAnalysis.performance_score)}`}>
                    {currentAnalysis.performance_score?.toFixed(0) || 'N/A'}
                  </div>
                  <Progress
                    value={currentAnalysis.performance_score || 0}
                    className="mt-2 h-2"
                  />
                </CardContent>
              </Card>
              <Card className="stat-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    Tech Debt
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getScoreColor(currentAnalysis.debt_score)}`}>
                    {currentAnalysis.debt_score?.toFixed(0) || 'N/A'}
                  </div>
                  <Progress
                    value={currentAnalysis.debt_score || 0}
                    className="mt-2 h-2"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analysis */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Issue Categories */}
              <Card>
                <CardHeader>
                  <CardTitle>Issue Categories</CardTitle>
                  <CardDescription>Distribution of detected issues</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {Object.entries(issuesByCategory).map(([category, count]) => (
                      <div key={category} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColors[category] }} />
                        <span className="text-sm capitalize">{category}: {count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Severity */}
              <Card>
                <CardHeader>
                  <CardTitle>Severity Breakdown</CardTitle>
                  <CardDescription>Issues by severity level</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(issuesBySeverity).map(([severity, count]) => (
                      <div key={severity} className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: severityColors[severity] }} />
                        <span className="flex-1 capitalize">{severity}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Issues</span>
                      <span className="font-bold">{issues.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Issues List */}
            <Card>
              <CardHeader>
                <CardTitle>Detected Issues</CardTitle>
                <CardDescription>{issues.length} issues found in this analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {issues.map((issue) => (
                      <div
                        key={issue.id}
                        className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                style={{ backgroundColor: severityColors[issue.severity], color: 'white' }}
                              >
                                {issue.severity}
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {issue.category}
                              </Badge>
                            </div>
                            <h4 className="font-medium">{issue.title}</h4>
                            {issue.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {issue.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>{issue.file_path}</span>
                              {issue.line_start && (
                                <span>Line {issue.line_start}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {issue.suggestion && (
                          <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                            Suggestion: {issue.suggestion}
                          </p>
                        )}
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
              <FileText className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No analysis yet</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Run an analysis to see detailed scores and issues for this repository.
              </p>
              <Button onClick={() => startAnalysis('full')} disabled={analyzing}>
                <Activity className="w-4 h-4 mr-2" />
                Run First Analysis
              </Button>
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Activity className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Select a repository</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Choose a repository from the dropdown to view its analysis results.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
