'use client';

import { useState, useRef, useEffect } from 'react';
import { CheckCircle2, Network, Send } from 'lucide-react';
import { useProjectStore } from '@/store/project-store';
import { useProjectWebSocket } from '@/hooks/useProjectWebSocket';
import { ArchitectLogo } from '@/components/brand/architect-logo';
import { AiResponseLoader } from '@/components/ui/ai-response-loader';

interface GeneratedNodeSummary {
  id?: string;
  label?: string;
}

export function ProjectSidebar({ projectId }: { projectId: string }) {
  const [prompt, setPrompt] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { chatHistory, isStreaming, streamContent, setStreamState, addChatMessage } = useProjectStore();
  const { sendMessage } = useProjectWebSocket(projectId);

  function handleSendPrompt(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || isStreaming) return;

    // Immediately show the user's message
    addChatMessage({
      id: Date.now(),
      projectId: projectId,
      role: 'user',
      content: prompt,
      createdAt: new Date().toISOString(),
    });

    setStreamState(true, '');
    sendMessage({ 
      type: 'AI_CHAT_STREAM', 
      prompt,
      currentArchitecture: {
        nodes: useProjectStore.getState().nodes,
        edges: useProjectStore.getState().edges
      }
    });
    setPrompt('');
  }

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, streamContent]);

  return (
    <aside className="z-20 flex h-full w-[380px] shrink-0 flex-col border-r border-white/10 bg-zinc-950/82 shadow-[22px_0_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      {/* Sidebar header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <ArchitectLogo subtitle="AI Orchestrator" markClassName="h-9 w-9" />
        <div className="flex items-center gap-1.5 rounded-full border border-lime-300/20 bg-lime-300/8 px-2 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-lime-200 shadow-[0_0_12px_rgba(190,242,100,0.8)]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-lime-100">
            Live
          </span>
        </div>
      </div>

      {/* Chat messages area */}
      <div className="scrollbar-polished flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {chatHistory.length === 0 ? (
          <div className="animate-fade-in-scale rounded-lg border border-cyan-300/14 bg-cyan-300/[0.045] px-4 py-4 shadow-[0_0_40px_rgba(34,211,238,0.06)]">
            <div className="mb-3 flex items-center gap-2">
              <Network className="h-4 w-4 text-cyan-100" />
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-100">
                Start with intent
              </span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-400">
              Describe the architecture you want to build to get started.
            </p>
            <div className="mt-3 rounded-lg border border-white/8 bg-black/20 p-3 text-[11px] leading-relaxed text-zinc-500">
              Example: Design a multi-tenant SaaS with auth, billing, job workers, analytics, and PostgreSQL.
            </div>
          </div>
        ) : (
          <>
            {chatHistory.map((msg, idx) => {
              // Parse out conversational markdown and JSON block
              let markdownText = msg.content;
              let jsonBlock = null;

              if (msg.role === 'assistant') {
                const jsonMatch = msg.content.match(/```json\n([\s\S]*?)\n```/);
                if (jsonMatch) {
                  jsonBlock = jsonMatch[1];
                  markdownText = msg.content.replace(jsonMatch[0], '').trim();
                } else if (msg.content.trim().startsWith('{')) {
                  jsonBlock = msg.content;
                  markdownText = '';
                }

                // Strip out think tags for markdown display
                const thinkMatch = markdownText.match(/<think>([\s\S]*?)<\/think>/);
                if (thinkMatch) {
                  markdownText = markdownText.replace(thinkMatch[0], '').trim();
                }
              }

              const parts = msg.content.match(/<think>([\s\S]*?)<\/think>/);
              const think = parts ? parts[1].trim() : null;
              
              return (
                <div key={idx} className={`flex animate-fade-in-scale ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[92%] rounded-lg px-3.5 py-3 shadow-lg transition-all duration-300 hover:-translate-y-0.5 ${
                      msg.role === 'user'
                        ? 'bg-cyan-300/12 border border-cyan-300/20 text-cyan-50 shadow-cyan-950/20'
                        : 'bg-white/[0.045] border border-white/10 text-zinc-300 shadow-black/20'
                    }`}
                  >
                    {msg.role === 'assistant' && think && (
                      <details className="mb-2 group">
                        <summary className="cursor-pointer select-none text-[10px] font-semibold uppercase tracking-wider text-zinc-500 hover:text-cyan-100">
                          Thought Process
                        </summary>
                        <div className="mt-2 mb-2 text-[11px] text-zinc-400 border-l-2 border-white/10 pl-2 ml-1 whitespace-pre-wrap leading-relaxed">
                          {think}
                        </div>
                      </details>
                    )}
                    
                    {/* Render conversational text */}
                    {markdownText && (
                      <div className="whitespace-pre-wrap text-xs leading-relaxed">
                        {markdownText}
                      </div>
                    )}

                    {/* Render JSON success card */}
                    {msg.role === 'assistant' && jsonBlock && (
                      <div className="mt-2 flex flex-col gap-2 rounded-lg border border-lime-300/15 bg-black/25 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-lime-300/12 text-lime-100 ring-1 ring-lime-200/20">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-xs font-bold text-zinc-200">Architecture Generated</span>
                        </div>
                        {(() => {
                          try {
                            const parsed = JSON.parse(jsonBlock);
                            const nodeCount = parsed.nodes?.length || 0;
                            const edgeCount = parsed.edges?.length || 0;
                            return (
                              <>
                                <div className="mb-2 grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-400">
                                  <span className="rounded-md border border-white/8 bg-white/[0.035] px-2 py-1">
                                  {nodeCount} nodes · {edgeCount} connections
                                  </span>
                                  <span className="rounded-md border border-cyan-300/10 bg-cyan-300/[0.04] px-2 py-1 text-cyan-100">
                                    Canvas synced
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {(parsed.nodes as GeneratedNodeSummary[] | undefined)?.map((n, i) => (
                                    <span key={i} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-medium text-zinc-400 transition-colors hover:border-cyan-300/20 hover:text-cyan-100">
                                      {n.label || n.id}
                                    </span>
                                  ))}
                                </div>
                              </>
                            );
                          } catch {
                            return <p className="text-xs text-zinc-400">Invalid JSON data</p>;
                          }
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Streaming Message Indicator */}
            {isStreaming && (
              <div className="flex justify-start animate-fade-in-up">
                <div className="max-w-[92%]">
                  {!streamContent && <AiResponseLoader label="Contacting backend" />}
                  {streamContent && (
                    <div className="rounded-lg border border-cyan-300/24 bg-white/[0.045] px-3 py-2 shadow-[0_0_25px_rgba(34,211,238,0.08)]">
                  {(() => {
                    let think = null;
                    
                    const match = streamContent.match(/<think>([\s\S]*?)<\/think>/);
                    if (match) {
                      think = match[1].trim();
                    } else if (streamContent.includes('<think>')) {
                      think = streamContent.replace('<think>', '').trim();
                    }
                    
                    return (
                      <>
                        {think && (
                          <details className="mb-2 group" open>
                            <summary className="cursor-pointer select-none text-[10px] font-semibold uppercase tracking-wider text-cyan-100">
                              Reasoning...
                            </summary>
                            <div className="ml-1 mt-2 whitespace-pre-wrap border-l-2 border-cyan-300/30 pl-2 text-[11px] leading-relaxed text-zinc-400">
                              {think}
                            </div>
                          </details>
                        )}
                        {!think && (
                          <AiResponseLoader label="Analyzing request" compact />
                        )}
                      </>
                    );
                  })()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat input */}
      <div className="shrink-0 border-t border-white/10 bg-zinc-950/88 p-3">
        <form onSubmit={handleSendPrompt} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2 shadow-[0_0_30px_rgba(0,0,0,0.22)] transition-all duration-300 focus-within:border-cyan-300/40 focus-within:bg-cyan-300/[0.045]">
          <input
            id="sidebar-chat-input"
            placeholder="Describe your system…"
            disabled={isStreaming}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-zinc-600 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isStreaming || !prompt.trim()}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-cyan-200 text-zinc-950 transition-all duration-200 hover:scale-105 hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="h-3 w-3" />
          </button>
        </form>
      </div>
    </aside>
  );
}
