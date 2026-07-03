'use client';

import { useState, useEffect } from 'react';
import { supabase, Repository } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Layers,
  Box,
  GitBranch,
  Database,
  Server,
  Monitor,
  Loader2,
  RefreshCw,
  Copy,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ArchitecturePage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

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
      if (data && data.length > 0) {
        setSelectedRepo(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDiagrams = async () => {
    if (!selectedRepo) return;
    setAnalyzing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setAnalyzing(false);
    toast.success('Architecture diagrams generated');
  };

  const componentDiagram = `graph TD
    A[Client App] --> B[API Gateway]
    B --> C[Auth Service]
    B --> D[User Service]
    B --> E[Project Service]
    C --> F[(User DB)]
    D --> F
    E --> G[(Project DB)]
    E --> H[Cache Layer]

    style A fill:#3b82f6,color:#fff
    style B fill:#10b981,color:#fff
    style C fill:#f59e0b,color:#fff
    style D fill:#f59e0b,color:#fff
    style E fill:#f59e0b,color:#fff
    style F fill:#ef4444,color:#fff
    style G fill:#ef4444,color:#fff
    style H fill:#8b5cf6,color:#fff`;

  const classDiagram = `classDiagram
    class User {
      +String id
      +String email
      +String name
      +login()
      +logout()
      +updateProfile()
    }

    class Project {
      +String id
      +String name
      +String description
      +Date created
      +addMember()
      +removeMember()
    }

    class Analysis {
      +String id
      +String type
      +Number score
      +run()
      +getResults()
    }

    class Issue {
      +String id
      +String severity
      +String title
      +resolve()
    }

    User "1" --> "*" Project : owns
    Project "1" --> "*" Analysis : has
    Analysis "1" --> "*" Issue : finds`;

  const sequenceDiagram = `sequenceDiagram
    participant U as User
    participant C as Client
    participant A as API Server
    participant D as Database

    U->>C: Click Analyze
    C->>A: POST /api/analysis
    A->>D: Create analysis record
    D-->>A: Analysis ID
    A->>A: Run AI Analysis
    A->>D: Store results
    A-->>C: Analysis complete
    C-->>U: Display results`;

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
          <h1 className="text-3xl font-bold">Architecture Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Visualize project structure with UML diagrams
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
          <Button onClick={generateDiagrams} disabled={analyzing || !selectedRepo}>
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Layers className="w-4 h-4 mr-2" />
                Generate Diagrams
              </>
            )}
          </Button>
        </div>
      </div>

      {selectedRepo ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Tech Stack */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="w-5 h-5" />
                Technology Stack
              </CardTitle>
              <CardDescription>Detected technologies and frameworks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Frontend
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge>React</Badge>
                    <Badge>TypeScript</Badge>
                    <Badge variant="outline">Tailwind CSS</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    Backend
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Node.js</Badge>
                    <Badge variant="secondary">Express</Badge>
                    <Badge variant="outline">Prisma</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Database
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="destructive">PostgreSQL</Badge>
                    <Badge variant="outline">Redis</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    DevOps
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Docker</Badge>
                    <Badge variant="outline">GitHub Actions</Badge>
                    <Badge variant="outline">Vercel</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Diagrams */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>UML Diagrams</CardTitle>
              <CardDescription>Architecture visualizations</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="component">
                <TabsList className="mb-4">
                  <TabsTrigger value="component">Component</TabsTrigger>
                  <TabsTrigger value="class">Class</TabsTrigger>
                  <TabsTrigger value="sequence">Sequence</TabsTrigger>
                </TabsList>

                <TabsContent value="component">
                  <div className="relative">
                    <div className="absolute top-2 right-2 z-10 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(componentDiagram);
                          toast.success('Diagram code copied');
                        }}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy Code
                      </Button>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <pre className="text-sm font-mono overflow-x-auto">{componentDiagram}</pre>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Paste this into Mermaid Live Editor to render: mermaid.live
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="class">
                  <div className="relative">
                    <div className="absolute top-2 right-2 z-10">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(classDiagram);
                          toast.success('Diagram code copied');
                        }}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy Code
                      </Button>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <pre className="text-sm font-mono overflow-x-auto">{classDiagram}</pre>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Paste this into Mermaid Live Editor to render: mermaid.live
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="sequence">
                  <div className="relative">
                    <div className="absolute top-2 right-2 z-10">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(sequenceDiagram);
                          toast.success('Diagram code copied');
                        }}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy Code
                      </Button>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <pre className="text-sm font-mono overflow-x-auto">{sequenceDiagram}</pre>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Paste this into Mermaid Live Editor to render: mermaid.live
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Layers className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Select a repository</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Choose a repository to analyze its architecture.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
