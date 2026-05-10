import { serverApi } from '@/lib/server-api';
import { CreateProjectDialog } from '@/components/dashboard/create-project-dialog';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu, LayoutDashboard, Calendar } from 'lucide-react';
import Link from 'next/link';

// Using server-side fetch from our backend
async function getProjects() {
  try {
    const res = await serverApi.get<{ data: Array<{ id: string; name: string; createdAt: string }> }>('/projects');
    return res.data;
  } catch (error) {
    console.error('Failed to load projects:', error);
    return [];
  }
}

export default async function DashboardPage() {
  const projects = await getProjects();

  return (
    <div className="flex h-full flex-col px-8 py-8 overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in-up">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1">
              <Cpu className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-violet-300">
                Architect AI Workspace
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Your Architectures
            </h1>
            <p className="text-zinc-400">
              Manage your system designs and AI sessions.
            </p>
          </div>
          <CreateProjectDialog />
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/4 shadow-xl shadow-black/30 mb-4">
              <Cpu className="h-7 w-7 text-violet-400" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground mb-1">
              No architectures yet
            </h2>
            <p className="text-sm text-zinc-500 max-w-xs leading-relaxed mb-6">
              Create your first project to start designing distributed systems with AI.
            </p>
            <CreateProjectDialog />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {projects.map((project) => (
              <Link key={project.id} href={`/dashboard/project/${project.id}`}>
                <Card className="h-full border-white/8 bg-card/50 hover:bg-card hover:border-violet-500/30 transition-all duration-200 cursor-pointer group shadow-lg shadow-black/20">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 group-hover:bg-violet-500/20 group-hover:scale-110 transition-all duration-300 shadow-inner">
                        <Cpu className="h-6 w-6 text-violet-400 group-hover:text-violet-300" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-base font-medium group-hover:text-violet-300 transition-colors">
                        {project.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(project.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
