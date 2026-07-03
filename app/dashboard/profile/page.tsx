'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Repository, Analysis } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Mail,
  Github,
  Calendar,
  Trophy,
  Target,
  Activity,
  Loader2,
  Save,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';

interface UserStats {
  totalRepos: number;
  totalAnalyses: number;
  averageScore: number | null;
}

const achievements = [
  { id: 'first_analysis', title: 'First Analysis', description: 'Run your first code analysis', icon: Target, unlocked: true },
  { id: 'security_pro', title: 'Security Pro', description: 'Find 10 security issues', icon: Trophy, unlocked: true },
  { id: 'code_master', title: 'Code Master', description: 'Achieve 90+ score', icon: Activity, unlocked: false },
  { id: 'doc_generator', title: 'Doc Generator', description: 'Generate 5 documentation sets', icon: Briefcase, unlocked: true },
];

export default function ProfilePage() {
  const { profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<UserStats>({ totalRepos: 0, totalAnalyses: 0, averageScore: null });
  const [recentRepos, setRecentRepos] = useState<Repository[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<Analysis[]>([]);

  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    github_username: '',
    skills: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        github_username: profile.github_username || '',
        skills: profile.skills?.join(', ') || '',
      });
      fetchUserData();
    }
  }, [profile]);

  const fetchUserData = async () => {
    try {
      const [reposRes, analysesRes] = await Promise.all([
        supabase.from('repositories').select('*', { count: 'exact' }),
        supabase.from('analyses').select('*', { count: 'exact' }),
      ]);

      setStats({
        totalRepos: reposRes.count || 0,
        totalAnalyses: analysesRes.count || 0,
        averageScore: null,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    const skillsArray = formData.skills
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const { error } = await updateProfile({
      full_name: formData.full_name,
      bio: formData.bio,
      github_username: formData.github_username,
      skills: skillsArray,
    });

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully');
    }

    setSaving(false);
  };

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase()
    : profile?.email?.[0]?.toUpperCase() || 'U';

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
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and view your activity
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your profile details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6 mb-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-lg">{profile?.full_name || 'User'}</h3>
                  <p className="text-muted-foreground">{profile?.email}</p>
                  <Badge className="mt-2 capitalize">{profile?.role}</Badge>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Your full name"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="github_username">GitHub Username</Label>
                  <div className="relative">
                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="github_username"
                      value={formData.github_username}
                      onChange={(e) => setFormData({ ...formData, github_username: e.target.value })}
                      placeholder="your-username"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="skills">Skills</Label>
                  <Input
                    id="skills"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="JavaScript, Python, React, ..."
                  />
                  <p className="text-xs text-muted-foreground">Separate skills with commas</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself"
                    rows={3}
                  />
                </div>

                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats & Achievements */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <span>Repositories</span>
                  </div>
                  <span className="font-bold">{stats.totalRepos}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <span>Analyses Run</span>
                  </div>
                  <span className="font-bold">{stats.totalAnalyses}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Member Since</span>
                  </div>
                  <span className="text-sm">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Achievements
              </CardTitle>
              <CardDescription>Your earned badges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      achievement.unlocked
                        ? 'bg-primary/10'
                        : 'bg-muted/50 opacity-50'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        achievement.unlocked
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <achievement.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{achievement.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {achievement.description}
                      </p>
                    </div>
                    {achievement.unlocked && (
                      <Badge variant="secondary" className="ml-auto">
                        Unlocked
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
