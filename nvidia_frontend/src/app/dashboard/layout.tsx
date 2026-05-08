'use client';

import { useRouter, useParams } from 'next/navigation';
import { signOut, useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Cpu, LogOut, Loader2, Send } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '@/store/project-store';
import { useProjectWebSocket } from '@/hooks/useProjectWebSocket';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.projectId as string | undefined;

  const { data: session, isPending } = useSession();
  const [signingOut, setSigningOut] = useState(false);
  const [prompt, setPrompt] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { chatHistory, isStreaming, streamContent, setStreamState, addChatMessage } = useProjectStore();
  const { sendMessage } = useProjectWebSocket(projectId);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.push('/login');
    router.refresh();
  }

  function handleSendPrompt(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || isStreaming) return;

    // Immediately show the user's message
    addChatMessage({
      id: Date.now(),
      projectId: projectId || '',
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
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* ══════════════════════════════════════════════════════════════════════
          LEFT SIDEBAR — AI Chat Orchestrator
      ══════════════════════════════════════════════════════════════════════ */}
      <aside className="flex w-[300px] shrink-0 flex-col border-r border-white/8 bg-sidebar">
        {/* Sidebar header */}
        <div className="flex h-14 items-center gap-2.5 border-b border-white/8 px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/10">
            <Cpu className="h-3.5 w-3.5 text-violet-400" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Architect AI
          </span>
        </div>

        {/* Chat area label */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            AI Orchestrator
          </p>
        </div>

        {/* Chat messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          {!projectId ? (
            <div className="rounded-lg border border-white/6 bg-white/3 px-3 py-2.5">
              <p className="text-xs text-zinc-500 leading-relaxed">
                Open or create an architecture to start chatting with the AI agents.
              </p>
            </div>
          ) : (
            <>
              {chatHistory.map((msg, idx) => {
                const parts = msg.content.match(/<think>([\s\S]*?)<\/think>([\s\S]*)/);
                const think = parts ? parts[1].trim() : null;
                const response = parts ? parts[2].trim() : msg.content;
                
                return (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                        msg.role === 'user'
                          ? 'rounded-tr-sm bg-violet-600/20 border border-violet-500/20'
                          : 'rounded-tl-sm bg-white/4 border border-white/8'
                      }`}
                    >
                      {think && (
                        <details className="mb-2 group">
                          <summary className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 cursor-pointer select-none hover:text-zinc-300">
                            Thought Process
                          </summary>
                          <div className="mt-2 mb-1 text-xs text-zinc-400 border-l-2 border-white/10 pl-2 ml-1 whitespace-pre-wrap">
                            {think}
                          </div>
                        </details>
                      )}
                      
                      {response && msg.role === 'user' ? (
                        <p className="text-xs leading-relaxed whitespace-pre-wrap text-violet-200">
                          {response}
                        </p>
                      ) : response && msg.role === 'assistant' && !response.includes('"nodes":') && !response.trim().startsWith('{') ? (
                        <p className="text-xs leading-relaxed whitespace-pre-wrap text-zinc-300">
                          {response}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              
              {isStreaming && streamContent && (
                <div className="flex justify-start animate-fade-in-up">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white/4 border border-violet-500/30 px-3 py-2 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
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
                                Generating Architecture...
                              </summary>
                              <div className="mt-2 text-xs text-zinc-400 border-l-2 border-violet-500/30 pl-2 ml-1 whitespace-pre-wrap">
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
        <div className="border-t border-white/8 p-3 bg-sidebar">
          <form onSubmit={handleSendPrompt} className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-3 py-2 transition-all duration-200 focus-within:border-violet-500/40 focus-within:bg-violet-500/5">
            <input
              id="sidebar-chat-input"
              placeholder={projectId ? "Describe your system…" : "Select a project first"}
              disabled={!projectId || isStreaming}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-zinc-600 outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!projectId || isStreaming || !prompt.trim()}
              className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-600 hover:bg-violet-500 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-white"
              aria-label="Send message"
            >
              <Send className="h-3 w-3" />
            </button>
          </form>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN CONTENT — Canvas workspace
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top nav bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/8 bg-background/80 px-5 backdrop-blur-sm z-10">
          {/* Left: breadcrumb / title */}
          <div className="flex items-center gap-2">
            <Button variant="link" onClick={() => router.push('/dashboard')} className="p-0 h-auto text-sm font-medium text-zinc-400 hover:text-violet-400">
              Workspace
            </Button>
            {projectId && (
              <>
                <span className="text-zinc-700">/</span>
                <span className="text-sm font-medium text-foreground">Project {projectId.slice(0,6)}</span>
              </>
            )}
          </div>

          {/* Right: user chip + sign-out */}
          <div className="flex items-center gap-3">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />
            ) : session ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/4 py-1 pl-1 pr-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600/30 text-violet-300">
                    <span className="text-[10px] font-bold uppercase">
                      {session.user.name?.[0] ?? session.user.email[0]}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-zinc-300 max-w-[120px] truncate">
                    {session.user.name ?? session.user.email}
                  </span>
                </div>

                <Button
                  id="sign-out-button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="h-8 gap-1.5 px-2.5 text-zinc-400 hover:text-foreground hover:bg-white/6 transition-all duration-200"
                >
                  {signingOut ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LogOut className="h-3.5 w-3.5" />
                  )}
                  <span className="text-xs">Sign out</span>
                </Button>
              </div>
            ) : null}
          </div>
        </header>

        {/* Canvas area */}
        <main className="relative flex-1 overflow-hidden bg-dot-grid">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,oklch(0.09_0_0)_100%)] z-0"
          />
          <div className="relative z-10 h-full w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
