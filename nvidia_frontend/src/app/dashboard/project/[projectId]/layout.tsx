import { ProjectSidebar } from '@/components/canvas/ProjectSidebar';

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="flex h-full w-full overflow-hidden">
      <ProjectSidebar projectId={projectId} />
      <div className="flex-1 relative overflow-hidden">
        {children}
      </div>
    </div>
  );
}
