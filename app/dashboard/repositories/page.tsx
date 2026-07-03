'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, Repository } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  GitBranch,
  Plus,
  Search,
  Star,
  GitFork,
  FileCode,
  Upload,
  Link as LinkIcon,
  Loader2,
  Trash2,
  MoreVertical,
  RefreshCw,
  BarChart3,
  Clock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export default function RepositoriesPage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New repository form state
  const [newRepo, setNewRepo] = useState<{
    sourceType: 'github' | 'zip' | 'git_url';
    name: string;
    sourceUrl: string;
    description: string;
  }>({
    sourceType: 'git_url',
    name: '',
    sourceUrl: '',
    description: '',
  });

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    try {
      const { data, error } = await supabase
        .from('repositories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRepositories(data || []);
    } catch (error) {
      console.error('Error fetching repositories:', error);
      toast.error('Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepo.name) {
      toast.error('Please enter a repository name');
      return;
    }

    if (newRepo.sourceType !== 'zip' && !newRepo.sourceUrl) {
      toast.error('Please enter a source URL');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from('repositories').insert({
        name: newRepo.name,
        description: newRepo.description || null,
        source_type: newRepo.sourceType,
        source_url: newRepo.sourceUrl || null,
        status: 'pending',
      });

      if (error) throw error;

      toast.success('Repository added successfully');
      setDialogOpen(false);
      setNewRepo({
        sourceType: 'git_url',
        name: '',
        sourceUrl: '',
        description: '',
      });
      fetchRepositories();
    } catch (error) {
      console.error('Error adding repository:', error);
      toast.error('Failed to add repository');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this repository?')) return;

    try {
      const { error } = await supabase.from('repositories').delete().eq('id', id);
      if (error) throw error;

      toast.success('Repository deleted');
      fetchRepositories();
    } catch (error) {
      console.error('Error deleting repository:', error);
      toast.error('Failed to delete repository');
    }
  };

  const filteredRepos = repositories.filter((repo) => {
    const matchesSearch = repo.name.toLowerCase().includes(search.toLowerCase()) ||
      (repo.language?.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || repo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      completed: 'default',
      analyzing: 'secondary',
      pending: 'outline',
      failed: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
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
          <h1 className="text-3xl font-bold">Repositories</h1>
          <p className="text-muted-foreground mt-1">
            Manage and analyze your code repositories
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Repository
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Add Repository</DialogTitle>
                <DialogDescription>
                  Import a repository from GitHub, Git URL, or upload a ZIP file.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <Tabs
                  value={newRepo.sourceType}
                  onValueChange={(v) => setNewRepo({ ...newRepo, sourceType: v as 'github' | 'zip' | 'git_url' })}
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="git_url">
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Git URL
                    </TabsTrigger>
                    <TabsTrigger value="github">
                      <GitBranch className="w-4 h-4 mr-2" />
                      GitHub
                    </TabsTrigger>
                    <TabsTrigger value="zip">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload ZIP
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="git_url" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="git-url">Repository URL</Label>
                      <Input
                        id="git-url"
                        placeholder="https://github.com/user/repo.git"
                        value={newRepo.sourceUrl}
                        onChange={(e) => setNewRepo({ ...newRepo, sourceUrl: e.target.value })}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="github" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="github-url">GitHub Repository URL</Label>
                      <Input
                        id="github-url"
                        placeholder="https://github.com/user/repo"
                        value={newRepo.sourceUrl}
                        onChange={(e) => setNewRepo({ ...newRepo, sourceUrl: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Connect your GitHub repository for automatic analysis
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="zip" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="zip-upload">Upload ZIP File</Label>
                      <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Drag and drop your ZIP file here, or click to browse
                        </p>
                        <Input id="zip-upload" type="file" accept=".zip" className="hidden" />
                        <Button variant="outline" type="button" onClick={() => {
                          document.getElementById('zip-upload')?.click();
                        }}>
                          Choose File
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="space-y-2">
                  <Label htmlFor="repo-name">Repository Name</Label>
                  <Input
                    id="repo-name"
                    placeholder="my-awesome-project"
                    value={newRepo.name}
                    onChange={(e) => setNewRepo({ ...newRepo, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="repo-description">Description (Optional)</Label>
                  <Textarea
                    id="repo-description"
                    placeholder="Brief description of the repository"
                    value={newRepo.description}
                    onChange={(e) => setNewRepo({ ...newRepo, description: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Repository'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="analyzing">Analyzing</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Repository Grid */}
      {filteredRepos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <GitBranch className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No repositories found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your filters to see more repositories.'
                : 'Add your first repository to start analyzing code with AI.'}
            </p>
            {!search && statusFilter === 'all' && (
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Repository
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRepos.map((repo) => (
            <Card key={repo.id} className="card-hover group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Link href={`/dashboard/repositories/${repo.id}`} className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate hover:text-primary transition-colors">
                      {repo.name}
                    </CardTitle>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/analysis?repo=${repo.id}`}>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Analyze
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => fetchRepositories()}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(repo.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {repo.description && (
                  <CardDescription className="line-clamp-2">
                    {repo.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(repo.status)}
                    <span className="text-xs text-muted-foreground">
                      Added {formatDate(repo.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {repo.language && (
                      <div className="flex items-center gap-1">
                        <FileCode className="w-4 h-4" />
                        {repo.language}
                      </div>
                    )}
                    {repo.stars > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        {repo.stars}
                      </div>
                    )}
                    {repo.size > 0 && (
                      <div className="flex items-center gap-1">
                        {formatSize(repo.size)}
                      </div>
                    )}
                  </div>

                  {repo.last_analyzed_at && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      Last analyzed {formatDate(repo.last_analyzed_at)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
