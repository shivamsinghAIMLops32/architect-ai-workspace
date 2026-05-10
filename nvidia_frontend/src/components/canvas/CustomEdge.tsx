'use client';

import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
} from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Radio } from 'lucide-react';

export function CustomEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 24, // Rounder corners for smooth flow
  });

  const label = (data?.label as string) || '';
  const protocol = (data?.protocol as string) || '';
  const animated = (data?.animated as boolean) || false;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: selected ? 3 : 2,
          stroke: selected ? '#67e8f9' : '#64748b',
          strokeDasharray: animated ? '6 6' : 'none',
          animation: animated ? 'dashdraw 1s linear infinite' : 'none',
          opacity: 0.8,
        }}
        className={cn(
          "transition-all duration-200",
          selected ? "drop-shadow-[0_0_10px_rgba(103,232,249,0.55)] z-50" : ""
        )}
      />
      
      {/* 
        EdgeLabelRenderer allows rendering div elements inside the SVG edge context.
        The pointerEvents: 'all' is necessary for interacting with the label (e.g. tooltips).
      */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div className={cn(
              "flex items-center gap-1.5 rounded-full border bg-zinc-950/90 px-2.5 py-1 shadow-sm backdrop-blur-sm transition-all duration-200",
              selected ? "scale-105 border-cyan-300/50 text-zinc-100 shadow-cyan-300/20" : "border-white/10 text-zinc-400 hover:border-cyan-300/25"
            )}>
              {protocol && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-100">
                  {protocol}
                </span>
              )}
              {protocol && label && <div className="w-[1px] h-3 bg-white/10" />}
              <span className="text-[10px] font-medium max-w-[120px] truncate">
                {label}
              </span>
              {animated && (
                <Radio className="ml-1 h-3 w-3 animate-pulse text-lime-200" />
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
