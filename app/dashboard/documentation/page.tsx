'use client';

import { useState, useEffect } from 'react';
import { supabase, Repository, Report } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  FileText,
  Download,
  Copy,
  Loader2,
  FileCode,
  BookOpen,
  Database,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

const docTypes = [
  { id: 'readme', label: 'README', icon: BookOpen, description: 'Project overview and setup instructions' },
  { id: 'api', label: 'API Documentation', icon: Database, description: 'API endpoints and schemas' },
  { id: 'architecture', label: 'Architecture', icon: FileCode, description: 'System design and components' },
  { id: 'security', label: 'Security Report', icon: Shield, description: 'Security analysis and recommendations' },
];

export default function DocumentationPage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<Report | null>(null);

  useEffect(() => {
    fetchRepositories();
  }, []);

  useEffect(() => {
    if (selectedRepo) {
      fetchReports(selectedRepo);
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

  const fetchReports = async (repoId: string) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('repository_id', repoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
      if (data && data.length > 0) {
        setActiveDoc(data[0]);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const generateDocumentation = async (type: string) => {
    if (!selectedRepo) return;

    setGenerating(type);

    try {
      const docContent = generateDocContent(type);

      const { data, error } = await supabase
        .from('reports')
        .insert({
          repository_id: selectedRepo,
          type,
          title: docContent.title,
          content: docContent.content,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setReports([data, ...reports]);
        setActiveDoc(data);
        toast.success('Documentation generated successfully');
      }
    } catch (error) {
      console.error('Error generating documentation:', error);
      toast.error('Failed to generate documentation');
    } finally {
      setGenerating(null);
    }
  };

  const generateDocContent = (type: string) => {
    const contentMap: Record<string, { title: string; content: string }> = {
      readme: {
        title: 'README',
        content: `# Project Name

## Overview

This project is a modern web application built with cutting-edge technologies.

## Features

- Feature 1: Description
- Feature 2: Description
- Feature 3: Description

## Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/user/repo.git

# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

## Configuration

Create a \`.env\` file with the following variables:

\`\`\`
DATABASE_URL=your_database_url
API_KEY=your_api_key
\`\`\`

## Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run test\` - Run tests

## License

MIT License`,
      },
      api: {
        title: 'API Documentation',
        content: `# API Documentation

## Endpoints

### Authentication

#### POST /api/auth/login

Login to the system.

**Request Body:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "password123"
}
\`\`\`

**Response:**
\`\`\`json
{
  "token": "jwt_token",
  "user": {
    "id": "123",
    "email": "user@example.com"
  }
}
\`\`\`

### Users

#### GET /api/users

Get all users.

**Headers:**
- Authorization: Bearer {token}

**Response:**
\`\`\`json
{
  "users": [
    {
      "id": "123",
      "name": "John Doe",
      "email": "john@example.com"
    }
  ]
}
\`\`\`

#### POST /api/users

Create a new user.

**Request Body:**
\`\`\`json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword"
}
\`\`\``,
      },
      architecture: {
        title: 'Architecture Document',
        content: `# Architecture Overview

## System Design

\`\`\`
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│  Database   │
│   (React)   │     │  (Node.js)  │     │ (PostgreSQL)│
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │                   │
      │                    ▼                   │
      │            ┌─────────────┐             │
      └───────────▶│   Cache     │◀────────────┘
                   │   (Redis)   │
                   └─────────────┘
\`\`\`

## Components

### Frontend

- **Framework**: React 18 with TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Routing**: React Router v6

### Backend

- **Runtime**: Node.js 18
- **Framework**: Express.js
- **ORM**: Prisma
- **Authentication**: JWT

### Database

- **Primary**: PostgreSQL 15
- **Cache**: Redis 7
- **File Storage**: S3

## Data Flow

1. User interacts with Frontend
2. Frontend makes API requests to Backend
3. Backend validates and processes requests
4. Backend queries Database
5. Response is cached in Redis
6. Data is returned to Frontend`,
      },
      security: {
        title: 'Security Report',
        content: `# Security Analysis Report

## Summary

| Metric | Score | Status |
|--------|-------|--------|
| Overall | 75/100 | ⚠️ Moderate |
| Input Validation | 80 | ✅ Good |
| Authentication | 85 | ✅ Good |
| Authorization | 70 | ⚠️ Moderate |
| Data Protection | 65 | ⚠️ Moderate |

## Critical Issues

### 1. Hardcoded API Key

**Severity**: Critical
**File**: src/config/api.ts
**Line**: 45

**Issue**: API key is hardcoded in source code.

**Recommendation**: Move sensitive credentials to environment variables.

### 2. Missing CSRF Protection

**Severity**: High
**File**: src/server.ts
**Line**: 78

**Issue**: Cross-Site Request Forgery protection is not implemented.

**Recommendation**: Implement CSRF tokens for state-changing operations.

## Recommendations

1. **Implement rate limiting** on authentication endpoints
2. **Add input sanitization** for all user inputs
3. **Enable HTTPS** for all communications
4. **Use prepared statements** for database queries
5. **Implement audit logging** for sensitive operations

## Best Practices

✅ Using parameterized queries
✅ Password hashing with bcrypt
✅ JWT token validation
⚠️ Session management needs improvement
⚠️ CORS policy needs tightening`,
      },
    };

    return contentMap[type] || { title: 'Documentation', content: '' };
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
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
          <h1 className="text-3xl font-bold">Documentation Generator</h1>
          <p className="text-muted-foreground mt-1">
            Generate comprehensive documentation for your projects
          </p>
        </div>
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
      </div>

      {selectedRepo ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Generate Buttons */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Generate Documentation</CardTitle>
              <CardDescription>Choose a documentation type to generate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {docTypes.map((type) => (
                  <Button
                    key={type.id}
                    variant="outline"
                    className="w-full justify-start h-auto py-3"
                    onClick={() => generateDocumentation(type.id)}
                    disabled={generating !== null}
                  >
                    <div className="flex items-start gap-3">
                      <type.icon className="w-5 h-5 mt-0.5 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">{type.label}</p>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                    {generating === type.id && (
                      <Loader2 className="w-4 h-4 animate-spin ml-auto" />
                    )}
                  </Button>
                ))}
              </div>

              {reports.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium mb-3">Recent Documents</h3>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {reports.map((report) => (
                        <button
                          key={report.id}
                          onClick={() => setActiveDoc(report)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            activeDoc?.id === report.id
                              ? 'border-primary bg-primary/5'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{report.title}</p>
                            <Badge variant="outline" className="capitalize">
                              {report.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(report.created_at).toLocaleDateString()}
                          </p>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documentation Preview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{activeDoc?.title || 'Documentation Preview'}</CardTitle>
                  <CardDescription>
                    {activeDoc
                      ? `Generated on ${new Date(activeDoc.created_at).toLocaleString()}`
                      : 'Select or generate documentation'}
                  </CardDescription>
                </div>
                {activeDoc && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(activeDoc.content || '')}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {activeDoc ? (
                <ScrollArea className="h-[500px]">
                  <pre className="text-sm font-mono p-4 rounded-lg bg-muted whitespace-pre-wrap">
                    {activeDoc.content}
                  </pre>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <FileText className="w-16 h-16 opacity-50 mb-4" />
                  <p className="text-lg font-medium mb-2">No documentation yet</p>
                  <p className="text-sm">Generate documentation to preview it here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Select a repository</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Choose a repository to generate documentation for.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
