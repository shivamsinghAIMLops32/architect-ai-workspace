'use client';

import { useState, useRef, useEffect } from 'react';
import { Cpu, Send } from 'lucide-react';
import { useProjectStore } from '@/store/project-store';
import { useProjectWebSocket } from '@/hooks/useProjectWebSocket';

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
    <aside className="flex w-[350px] shrink-0 flex-col border-r border-white/8 bg-sidebar h-full z-20">
      {/* Sidebar header */}
      <div className="flex h-14 items-center gap-2.5 border-b border-white/8 px-4 shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/10">
          <Cpu className="h-3.5 w-3.5 text-violet-400" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">
          AI Orchestrator
        </span>
      </div>

      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {chatHistory.length === 0 ? (
          <div className="rounded-lg border border-white/6 bg-white/3 px-3 py-2.5">
            <p className="text-xs text-zinc-500 leading-relaxed">
              Describe the architecture you want to build to get started.
            </p>
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
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[90%] rounded-2xl px-3 py-2 ${
                      msg.role === 'user'
                        ? 'rounded-tr-sm bg-violet-600/20 border border-violet-500/20 text-violet-200'
                        : 'rounded-tl-sm bg-white/4 border border-white/8 text-zinc-300'
                    }`}
                  >
                    {msg.role === 'assistant' && think && (
                      <details className="mb-2 group">
                        <summary className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 cursor-pointer select-none hover:text-zinc-300">
                          Thought Process
                        </summary>
                        <div className="mt-2 mb-2 text-[11px] text-zinc-400 border-l-2 border-white/10 pl-2 ml-1 whitespace-pre-wrap leading-relaxed">
                          {think}
                        </div>
                      </details>
                    )}
                    
                    {/* Render conversational text */}
                    {markdownText && (
                      <div className="text-xs leading-relaxed whitespace-pre-wrap">
                        {markdownText}
                      </div>
                    )}

                    {/* Render JSON success card */}
                    {msg.role === 'assistant' && jsonBlock && (
                      <div className="flex flex-col gap-2 bg-black/20 rounded-lg p-3 border border-white/5 mt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/20 text-emerald-400 text-[10px]">✓</span>
                          <span className="text-xs font-semibold text-zinc-300">Architecture Generated</span>
                        </div>
                        {(() => {
                          try {
                            const parsed = JSON.parse(jsonBlock);
                            const nodeCount = parsed.nodes?.length || 0;
                            const edgeCount = parsed.edges?.length || 0;
                            return (
                              <>
                                <div className="text-[10px] text-zinc-500 font-mono mb-2">
                                  {nodeCount} nodes · {edgeCount} connections
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {parsed.nodes?.map((n: any, i: number) => (
                                    <span key={i} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[9px] font-medium text-zinc-400">
                                      {n.label || n.id}
                                    </span>
                                  ))}
                                </div>
                              </>
                            );
                          } catch (e) {
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
            {isStreaming && streamContent && (
              <div className="flex justify-start animate-fade-in-up">
                <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-white/4 border border-violet-500/30 px-3 py-2 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
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
                            <summary className="text-[10px] font-semibold uppercase tracking-wider text-violet-400 cursor-pointer select-none">
                              Reasoning...
                            </summary>
                            <div className="mt-2 text-[11px] text-zinc-400 border-l-2 border-violet-500/30 pl-2 ml-1 whitespace-pre-wrap leading-relaxed">
                              {think}
                            </div>
                          </details>
                        )}
                        {!think && (
                          <div className="text-xs text-zinc-400 italic">
                            Analyzing request...
                            <span className="ml-1 inline-block w-1.5 h-3 bg-violet-400 animate-pulse align-middle" />
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat input */}
      <div className="border-t border-white/8 p-3 bg-sidebar shrink-0">
        <form onSubmit={handleSendPrompt} className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-3 py-2 transition-all duration-200 focus-within:border-violet-500/40 focus-within:bg-violet-500/5">
          <input
            id="sidebar-chat-input"
            placeholder="Describe your system…"
            disabled={isStreaming}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 bg-transparent text-xs text-foreground placeholder:text-zinc-600 outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isStreaming || !prompt.trim()}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-600 hover:bg-violet-500 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-white"
            aria-label="Send message"
          >
            <Send className="h-3 w-3" />
          </button>
        </form>
      </div>
    </aside>
  );
}
