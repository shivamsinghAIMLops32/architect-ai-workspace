import { Cpu, Network } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArchitectLogoProps {
  className?: string;
  markClassName?: string;
  showText?: boolean;
  subtitle?: string;
}

export function ArchitectLogo({
  className,
  markClassName,
  showText = true,
  subtitle,
}: ArchitectLogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'brand-mark group relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-cyan-300/25 bg-[linear-gradient(135deg,rgba(34,211,238,0.18),rgba(163,230,53,0.16)_46%,rgba(244,114,182,0.14))] shadow-[0_0_30px_rgba(34,211,238,0.16)]',
          markClassName
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_32%)] opacity-70" />
        <Network className="absolute h-6 w-6 text-lime-200/40 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
        <Cpu className="relative h-4.5 w-4.5 text-cyan-100 drop-shadow-[0_0_10px_rgba(103,232,249,0.75)]" />
      </div>
      {showText && (
        <div className="min-w-0">
          <div className="brand-wordmark text-sm font-black uppercase leading-none tracking-[0.18em] text-zinc-50">
            Architect AI
          </div>
          {subtitle && (
            <div className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-200/70">
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
