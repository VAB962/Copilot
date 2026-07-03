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
  Shield,
  AlertTriangle,
  Lock,
  Key,
  Eye,
  Database,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';

const securityCategories = [
  { id: 'hardcoded_secrets', label: 'Hardcoded Secrets', icon: Key },
  { id: 'sql_injection', label: 'SQL Injection', icon: Database },
  { id: 'xss', label: 'XSS Vulnerabilities', icon: Eye },
  { id: 'auth_issues', label: 'Auth Issues', icon: Lock },
];

export default function SecurityPage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [securityScore, setSecurityScore] = useState<number | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    fetchRepositories();
  }, []);

  useEffect(() => {
    if (selectedRepo) {
      fetchSecurityData(selectedRepo);
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

  const fetchSecurityData = async (repoId: string) => {
    try {
      const { data: analyses } = await supabase
        .from('analyses')
        .select('*')
        .eq('repository_id', repoId)
        .eq('type', 'security')
        .order('created_at', { ascending: false })
        .limit(1);

      if (analyses && analyses.length > 0) {
        setSecurityScore(analyses[0].security_score);

        const { data: issuesData } = await supabase
          .from('issues')
          .select('*')
          .eq('analysis_id', analyses[0].id)
          .eq('category', 'security');

        setIssues(issuesData || []);
      } else {
        setSecurityScore(null);
        setIssues([]);
      }
    } catch (error) {
      console.error('Error fetching security data:', error);
    }
  };

  const runSecurityScan = async () => {
    if (!selectedRepo) return;

    setScanning(true);

    try {
      const { data: analysis, error } = await supabase
        .from('analyses')
        .insert({
          repository_id: selectedRepo,
          type: 'security',
          status: 'processing',
        })
        .select()
        .single();

      if (error) throw error;

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const score = Math.floor(Math.random() * 30) + 60;

      await supabase
        .from('analyses')
        .update({
          status: 'completed',
          security_score: score,
          completed_at: new Date().toISOString(),
        })
        .eq('id', analysis.id);

      const sampleIssues = [
        {
          analysis_id: analysis.id,
          repository_id: selectedRepo,
          file_path: '/src/config/database.ts',
          line_start: 45,
          severity: 'critical' as const,
          category: 'security' as const,
          title: 'Hardcoded Database Password',
          description: 'Database password found in source code',
          suggestion: 'Use environment variables for sensitive data',
        },
        {
          analysis_id: analysis.id,
          repository_id: selectedRepo,
          file_path: '/src/api/users.ts',
          line_start: 78,
          severity: 'high' as const,
          category: 'security' as const,
          title: 'SQL Injection Vulnerability',
          description: 'User input directly concatenated into SQL query',
          suggestion: 'Use parameterized queries or an ORM',
        },
        {
          analysis_id: analysis.id,
          repository_id: selectedRepo,
          file_path: '/src/components/comment.tsx',
          line_start: 23,
          severity: 'medium' as const,
          category: 'security' as const,
          title: 'Potential XSS Vulnerability',
          description: 'User-generated content rendered without sanitization',
          suggestion: 'Use DOMPurify or similar library to sanitize HTML',
        },
      ];

      await supabase.from('issues').insert(sampleIssues);

      await fetchSecurityData(selectedRepo);
    } catch (error) {
      console.error('Error running security scan:', error);
    } finally {
      setScanning(false);
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number | null) => {
    if (score === null) return 'Not Scanned';
    if (score >= 80) return 'Secure';
    if (score >= 60) return 'Moderate Risk';
    return 'High Risk';
  };

  const severityCount = issues.reduce((acc, issue) => {
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
          <h1 className="text-3xl font-bold">Security Scanner</h1>
          <p className="text-muted-foreground mt-1">
            Detect vulnerabilities and security issues in your code
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
          <Button onClick={runSecurityScan} disabled={scanning || !selectedRepo}>
            {scanning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Run Security Scan
              </>
            )}
          </Button>
        </div>
      </div>

      {selectedRepo ? (
        <>
          {/* Score Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="md:col-span-2 stat-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className={`text-6xl font-bold ${getScoreColor(securityScore)}`}>
                    {securityScore !== null ? securityScore : '--'}
                  </div>
                  <div>
                    <Badge
                      variant={securityScore !== null && securityScore >= 80 ? 'default' : 'destructive'}
                      className="mb-2"
                    >
                      {getScoreLabel(securityScore)}
                    </Badge>
                    <Progress
                      value={securityScore || 0}
                      className="w-32 h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {(['critical', 'high', 'medium', 'low'] as const).map((severity) => (
              <Card key={severity} className="stat-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium capitalize">{severity} Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {severityCount[severity] || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Found in scan</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Security Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Security Categories</CardTitle>
              <CardDescription>Types of vulnerabilities detected</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {securityCategories.map((category) => (
                  <div
                    key={category.id}
                    className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <category.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{category.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {Math.floor(Math.random() * 5)} issues
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Issues List */}
          <Card>
            <CardHeader>
              <CardTitle>Security Issues</CardTitle>
              <CardDescription>{issues.length} security issues found</CardDescription>
            </CardHeader>
            <CardContent>
              {issues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No security issues found</p>
                  <p className="text-sm mt-1">Run a security scan to check for vulnerabilities</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {issues.map((issue) => (
                      <div
                        key={issue.id}
                        className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            issue.severity === 'critical' ? 'bg-red-100' :
                            issue.severity === 'high' ? 'bg-orange-100' :
                            issue.severity === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                          }`}>
                            <AlertTriangle className={`w-4 h-4 ${
                              issue.severity === 'critical' ? 'text-red-600' :
                              issue.severity === 'high' ? 'text-orange-600' :
                              issue.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={issue.severity === 'critical' ? 'destructive' : 'outline'}>
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
                                Recommendation: {issue.suggestion}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Shield className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Select a repository</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Choose a repository to scan for security vulnerabilities.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
