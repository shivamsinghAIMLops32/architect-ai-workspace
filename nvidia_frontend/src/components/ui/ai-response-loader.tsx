import { BrainCircuit, Cpu, Network, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiResponseLoaderProps {
  label?: string;
  compact?: boolean;
  className?: string;
}

export function AiResponseLoader({
  label = 'Architecting response',
  compact = false,
  className,
}: AiResponseLoaderProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-cyan-300/18 bg-zinc-950/86 shadow-[0_18px_70px_rgba(0,0,0,0.35)]',
        compact ? 'px-3 py-2' : 'px-4 py-3',
        className
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(34,211,238,0.08),transparent)] animate-shimmer" />
      <div className="relative flex items-center gap-3">
        <div className="ai-loader-core relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/8">
          <Network className="absolute h-7 w-7 text-lime-300/25" />
          <BrainCircuit className="h-4.5 w-4.5 text-cyan-100" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-lime-200/30 bg-lime-300/15">
            <Sparkles className="h-2.5 w-2.5 text-lime-100" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-xs font-bold uppercase tracking-[0.16em] text-cyan-100">
              {label}
            </span>
            <Cpu className="h-3 w-3 animate-pulse text-lime-200" />
          </div>
          {!compact && (
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <span className="h-1 rounded-full bg-cyan-300/35 animate-flow-bar" />
              <span className="h-1 rounded-full bg-lime-300/35 animate-flow-bar [animation-delay:160ms]" />
              <span className="h-1 rounded-full bg-fuchsia-300/30 animate-flow-bar [animation-delay:320ms]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
