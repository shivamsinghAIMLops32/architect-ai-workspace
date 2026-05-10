'use client';

import { Handle, Position, NodeProps } from '@xyflow/react';
import { Server, Database, Cloud, Globe, Layers, Cpu, MessageSquare, HardDrive, Activity, Network, Shield, Smartphone, Box } from 'lucide-react';
import { cn } from '@/lib/utils';

function renderIconForType(type: string | undefined, label: string) {
  const normalizedStr = `${type} ${label}`.toLowerCase();

  if (normalizedStr.includes('database') || normalizedStr.includes('sql')) return <Database className="h-5 w-5" />;
  if (normalizedStr.includes('server') || normalizedStr.includes('api')) return <Server className="h-5 w-5" />;
  if (normalizedStr.includes('cloud') || normalizedStr.includes('aws')) return <Cloud className="h-5 w-5" />;
  if (normalizedStr.includes('security') || normalizedStr.includes('auth') || normalizedStr.includes('firewall')) return <Shield className="h-5 w-5" />;
  if (normalizedStr.includes('web') || normalizedStr.includes('frontend') || normalizedStr.includes('cdn')) return <Globe className="h-5 w-5" />;
  if (normalizedStr.includes('mobile') || normalizedStr.includes('app')) return <Smartphone className="h-5 w-5" />;
  if (normalizedStr.includes('queue') || normalizedStr.includes('kafka') || normalizedStr.includes('rabbitmq')) return <MessageSquare className="h-5 w-5" />;
  if (normalizedStr.includes('storage') || normalizedStr.includes('s3') || normalizedStr.includes('bucket')) return <HardDrive className="h-5 w-5" />;
  if (normalizedStr.includes('cache') || normalizedStr.includes('redis')) return <Layers className="h-5 w-5" />;
  if (normalizedStr.includes('load_balancer') || normalizedStr.includes('proxy') || normalizedStr.includes('gateway')) return <Network className="h-5 w-5" />;
  if (normalizedStr.includes('monitor') || normalizedStr.includes('metric') || normalizedStr.includes('log')) return <Activity className="h-5 w-5" />;
  
  return <Cpu className="h-5 w-5" />;
}

function getTierColorClass(tier: string | undefined) {
  switch (tier) {
    case 'client': return 'border-sky-300/70 shadow-sky-300/20';
    case 'gateway': return 'border-amber-300/70 shadow-amber-300/20';
    case 'service': return 'border-cyan-300/70 shadow-cyan-300/20';
    case 'data': return 'border-lime-300/70 shadow-lime-300/20';
    case 'external': return 'border-fuchsia-300/70 shadow-fuchsia-300/20';
    default: return 'border-zinc-500 shadow-zinc-500/20';
  }
}

function getTierBgClass(tier: string | undefined) {
  switch (tier) {
    case 'client': return 'bg-sky-500/10 border-sky-500/20 text-sky-400';
    case 'gateway': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    case 'service': return 'bg-cyan-300/10 border-cyan-300/20 text-cyan-100';
    case 'data': return 'bg-lime-300/10 border-lime-300/20 text-lime-100';
    case 'external': return 'bg-fuchsia-300/10 border-fuchsia-300/20 text-fuchsia-100';
    default: return 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400';
  }
}

function getMethodColorClass(method: string) {
  switch (method?.toUpperCase()) {
    case 'GET': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'POST': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'PUT':
    case 'PATCH': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'DELETE': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  }
}

export function CustomNode({ data, selected }: NodeProps) {
  const tierClass = getTierColorClass(data.tier as string);
  const bgClass = getTierBgClass(data.tier as string);
  
  const techStack = data.techStack as string[] || [];
  const endpoints = data.endpoints as { method: string; path: string; desc: string }[] || [];
  const flowStep = data.flowStep as number | undefined;
  const flowDescription = data.flowDescription as string | undefined;
  const capacityEstimate = data.capacityEstimate as string | undefined;
  const label = (data.label as string) || 'Untitled component';
  const port = data.port as string | number | undefined;
  const nodeType = (data.type as string) || 'Service';
  const scaling = data.scaling as string | undefined;

  return (
    <div
      className={cn(
        "relative flex min-w-[380px] max-w-[420px] flex-col overflow-hidden rounded-lg border bg-zinc-950/92 shadow-2xl transition-all duration-300",
        selected ? `${tierClass} shadow-[0_0_44px_rgba(34,211,238,0.18)]` : "border-white/10 shadow-black/50 hover:-translate-y-1 hover:border-cyan-300/28"
      )}
    >
      {/* Target handle (top) - intentionally hidden, dagre handles edges */}
      <Handle type="target" position={Position.Left} className="!w-2 !h-8 !rounded-r-sm !rounded-l-none !border-0 !bg-zinc-700/50 -ml-1 opacity-0" />

      {/* Top accent strip */}
      <div className={cn("h-1.5 w-full", selected ? bgClass.split(' ')[0] : "bg-[linear-gradient(90deg,rgba(34,211,238,0.45),rgba(190,242,100,0.38),rgba(244,114,182,0.3))]")} />

      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_16%_8%,rgba(255,255,255,0.08),transparent_34%)]" />

      <div className="relative flex flex-col gap-3 p-4">
        {/* Header: Icon + Label + Port */}
        <div className="flex items-start gap-3">
          <div className="relative">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border shadow-inner", bgClass)}>
              {renderIconForType(nodeType, label)}
            </div>
            {flowStep && (
              <div className="absolute -left-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-cyan-200/50 bg-cyan-300 text-[10px] font-black text-zinc-950 shadow-md">
                {flowStep}
              </div>
            )}
          </div>
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[15px] font-bold tracking-tight text-zinc-100 truncate">
                {label}
              </span>
              {port && (
                <span className="shrink-0 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                  :{port}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
                {nodeType}
              </span>
              {scaling && (
                <span className="text-[9px] uppercase tracking-wider text-zinc-600 bg-white/5 px-1 rounded-sm border border-white/5 flex items-center gap-1">
                  {scaling === 'horizontal' ? 'H' : scaling === 'vertical' ? 'V' : 'S'} {scaling}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tech Stack Pills */}
        {techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {techStack.map((tech, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full border border-cyan-300/10 bg-white/[0.035] px-2 py-0.5 text-[10px] font-medium text-zinc-300 transition-colors hover:border-cyan-300/25 hover:text-cyan-100">
                <Box className="w-2.5 h-2.5 text-zinc-500" />
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* Body: Description & Flow */}
        <div className="flex flex-col gap-1.5 pt-1">
          {Boolean(data.description) && (
            <div className="text-xs text-zinc-400 leading-relaxed">
              {data.description as string}
            </div>
          )}
          {flowDescription && (
            <div className="text-[11px] text-zinc-300 leading-relaxed border-l-2 border-violet-500/50 pl-2 ml-0.5 mt-1">
              <span className="font-semibold text-cyan-100">Flow: </span>
              {flowDescription}
            </div>
          )}
        </div>

        {/* Calculations / Capacity */}
        {capacityEstimate && (
          <div className="mt-1 flex items-center gap-2 rounded border border-lime-300/12 bg-lime-300/[0.04] px-2.5 py-1.5">
            <Activity className="h-3 w-3 shrink-0 text-lime-200" />
            <span className="text-[10px] font-mono text-zinc-400 truncate" title={capacityEstimate}>
              {capacityEstimate}
            </span>
          </div>
        )}

        {/* Footer: Endpoints */}
        {endpoints.length > 0 && (
          <div className="flex flex-col gap-1.5 border-t border-white/5 pt-2 mt-1">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">API Routes</span>
            <div className="flex flex-col gap-1.5">
              {endpoints.map((endpoint, i) => (
                <div key={i} className="flex items-start gap-2 rounded border border-white/5 bg-zinc-900/50 p-1.5 transition-colors hover:border-cyan-300/15 hover:bg-cyan-300/[0.035]">
                  <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 min-w-[40px] text-center", getMethodColorClass(endpoint.method))}>
                    {endpoint.method || 'ANY'}
                  </span>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[10px] font-mono text-zinc-300 truncate" title={endpoint.path}>{endpoint.path}</span>
                    <span className="text-[9px] text-zinc-500 truncate" title={endpoint.desc}>{endpoint.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Source handle (right) - intentionally hidden */}
      <Handle type="source" position={Position.Right} className="!w-2 !h-8 !rounded-l-sm !rounded-r-none !border-0 !bg-zinc-700/50 -mr-1 opacity-0" />
    </div>
  );
}
