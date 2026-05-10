import { serverApi } from '@/lib/server-api';
import { CanvasEditor } from '@/components/canvas/CanvasEditor';
import { notFound } from 'next/navigation';
import type { CanvasStateResponse } from '@/types/architecture';

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
}

async function getCanvasState(projectId: string) {
  try {
    const res = await serverApi.get<{ data: CanvasStateResponse }>(`/canvas/${projectId}`);
    return res.data;
  } catch (error) {
    console.error(`Failed to load canvas state for ${projectId}:`, error);
    return null;
  }
}

export default async function ProjectCanvasPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const canvasState = await getCanvasState(projectId);

  if (!canvasState) {
    notFound();
  }

  return (
    <CanvasEditor
      projectId={projectId}
      initialNodes={canvasState.nodes}
      initialEdges={canvasState.edges}
      initialChatHistory={canvasState.chatHistory}
    />
  );
}
