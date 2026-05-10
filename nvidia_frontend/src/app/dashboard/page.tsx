import { serverApi } from '@/lib/server-api';
import { CreateProjectDialog } from '@/components/dashboard/create-project-dialog';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu, Calendar, ArrowRight, Network, Sparkles } from 'lucide-react';
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
    <div className="scrollbar-polished flex h-full flex-col overflow-y-auto px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        {/* Header */}
        <div className="animate-fade-in-up flex flex-col gap-5 rounded-none border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/8 px-3 py-1 shadow-[0_0_30px_rgba(34,211,238,0.08)]">
              <Sparkles className="h-3.5 w-3.5 text-lime-200" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-cyan-100">
                Architect AI Workspace
              </span>
            </div>
            <h1 className="text-balance text-4xl font-black tracking-tight text-foreground sm:text-5xl">
              Your Architectures
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-zinc-400">
              Manage your system designs, AI sessions, shared architecture maps, and production-ready thinking in one sharp workspace.
            </p>
          </div>
          <CreateProjectDialog />
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="animate-fade-in-up flex flex-col items-center justify-center py-24 text-center" style={{ animationDelay: '0.1s' }}>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/8 shadow-[0_0_60px_rgba(34,211,238,0.14)]">
              <Network className="h-7 w-7 text-cyan-100" />
            </div>
            <h2 className="mb-1 text-xl font-bold tracking-tight text-foreground">
              No architectures yet
            </h2>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-zinc-500">
              Create your first project to start designing distributed systems with AI.
            </p>
            <CreateProjectDialog />
          </div>
        ) : (
          <div className="animate-fade-in-up grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" style={{ animationDelay: '0.1s' }}>
            {projects.map((project) => (
              <Link key={project.id} href={`/dashboard/project/${project.id}`} className="group">
                <Card className="hover-lift h-full cursor-pointer rounded-lg border-white/10 bg-zinc-950/55 shadow-lg shadow-black/20">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/8 shadow-inner transition-all duration-300 group-hover:scale-110 group-hover:bg-cyan-300/14">
                        <Cpu className="h-6 w-6 text-cyan-100" />
                      </div>
                      <ArrowRight className="h-4 w-4 translate-x-1 text-zinc-600 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:text-lime-200 group-hover:opacity-100" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-base font-bold transition-colors group-hover:text-cyan-100">
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
