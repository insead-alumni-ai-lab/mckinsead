import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatSidebarProps {
  engagementId: Id<"engagements">;
  stage: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatSidebar({ engagementId, stage, isOpen, onClose }: ChatSidebarProps) {
  const messages = useQuery(api.chat.list, { engagementId });
  const sendMessage = useAction(api.chat.sendMessage);
  const clearHistory = useMutation(api.chat.clearHistory);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  // Focus textarea when sidebar opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setInput("");
    setSending(true);
    try {
      const result = await sendMessage({
        engagementId,
        message: trimmed,
        stage,
      });
      if (!result.success) {
        console.error("Chat error:", result.error);
      }
    } catch (err) {
      console.error("Chat send failed:", err);
    } finally {
      setSending(false);
    }
  }, [input, sending, sendMessage, engagementId, stage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = async () => {
    if (confirm("Clear all chat messages for this engagement?")) {
      await clearHistory({ engagementId });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[420px] max-w-[90vw] bg-background border-l shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="size-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Strategy Consultant</h3>
            <p className="text-[10px] text-muted-foreground capitalize">
              Stage: {stage}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={handleClear}
            title="Clear chat history"
          >
            <Trash2 className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {(!messages || messages.length === 0) && !sending && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageSquare className="size-6 text-primary" />
            </div>
            <h4 className="font-semibold text-sm mb-2">Your AI Strategy Consultant</h4>
            <p className="text-xs text-muted-foreground mb-4">
              Ask questions about your engagement, get help with frameworks, or let me guide you through the methodology.
            </p>
            <div className="space-y-2 w-full">
              {getStageStarters(stage).map((starter, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(starter); textareaRef.current?.focus(); }}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg border bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages?.map((msg) => (
          <ChatBubble key={msg._id} role={msg.role} content={msg.content} timestamp={msg.timestamp} />
        ))}

        {sending && (
          <div className="flex items-start gap-2">
            <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="size-3 text-primary" />
            </div>
            <div className="bg-muted rounded-lg rounded-tl-none px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                Thinking...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your engagement..."
            rows={2}
            className="resize-none text-sm"
            disabled={sending}
          />
          <Button
            size="icon"
            className="size-10 shrink-0 self-end"
            onClick={handleSend}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// ─── Chat Bubble ──────────────────────────────────────────────────────

function ChatBubble({ role, content, timestamp }: { role: string; content: string; timestamp: number }) {
  const isUser = role === "user";
  const time = new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`size-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-primary/10"
        }`}
      >
        {isUser ? (
          <span className="text-[10px] font-bold">Y</span>
        ) : (
          <Sparkles className="size-3 text-primary" />
        )}
      </div>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-none"
            : "bg-muted rounded-tl-none"
        }`}
      >
        <div className="text-xs whitespace-pre-wrap break-words leading-relaxed chat-content">
          <MarkdownContent content={content} isUser={isUser} />
        </div>
        <div
          className={`text-[9px] mt-1 ${
            isUser ? "text-primary-foreground/60" : "text-muted-foreground"
          }`}
        >
          {time}
        </div>
      </div>
    </div>
  );
}

// ─── Simple Markdown Renderer ─────────────────────────────────────────

function MarkdownContent({ content, isUser }: { content: string; isUser: boolean }) {
  // Simple markdown: **bold**, *italic*, bullet points, numbered lists
  const lines = content.split("\n");

  return (
    <>
      {lines.map((line, i) => {
        // Bullet points
        if (line.match(/^[-•]\s/)) {
          return (
            <div key={i} className="flex items-start gap-1.5 ml-1 my-0.5">
              <span className="text-[8px] mt-1">•</span>
              <span>{renderInline(line.replace(/^[-•]\s/, ""), isUser)}</span>
            </div>
          );
        }
        // Numbered lists
        const numMatch = line.match(/^(\d+)\.\s/);
        if (numMatch) {
          return (
            <div key={i} className="flex items-start gap-1.5 ml-1 my-0.5">
              <span className="text-[10px] font-semibold w-3 shrink-0">{numMatch[1]}.</span>
              <span>{renderInline(line.replace(/^\d+\.\s/, ""), isUser)}</span>
            </div>
          );
        }
        // Headers (### or ##)
        if (line.match(/^#{1,3}\s/)) {
          return (
            <div key={i} className="font-semibold mt-1.5 mb-0.5">
              {renderInline(line.replace(/^#{1,3}\s/, ""), isUser)}
            </div>
          );
        }
        // Empty line
        if (line.trim() === "") {
          return <div key={i} className="h-1.5" />;
        }
        // Regular text
        return <div key={i}>{renderInline(line, isUser)}</div>;
      })}
    </>
  );
}

function renderInline(text: string, isUser: boolean): React.ReactNode {
  // Bold: **text** or __text__
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className={isUser ? "font-bold" : "font-semibold text-foreground"}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// ─── Stage-specific conversation starters ─────────────────────────────

function getStageStarters(stage: string): string[] {
  const starters: Record<string, string[]> = {
    scoping: [
      "Help me frame the strategic question for this engagement",
      "What's the right SCQA for this company?",
      "Is my problem definition specific enough?",
    ],
    frameworks: [
      "What are the key themes across my framework analyses?",
      "Which framework is most relevant for my question?",
      "What contradictions do you see between frameworks?",
    ],
    hypothesis: [
      "Help me build a MECE hypothesis tree",
      "Are my hypotheses testable and falsifiable?",
      "What sub-hypotheses am I missing?",
    ],
    analysis: [
      "What analysis method should I use for each hypothesis?",
      "What data sources would strengthen my analysis?",
      "Help me design a test for my main hypothesis",
    ],
    synthesis: [
      "Help me structure my findings using the Pyramid Principle",
      "What's the governing thought that answers the strategic question?",
      "Are my key lines MECE?",
    ],
    communication: [
      "Help me write action titles for my slides",
      "What's the best visualization for this data?",
      "Review my slide structure for clarity",
    ],
    export: [
      "What format should I export in?",
      "Any final checks before I deliver?",
    ],
  };

  return starters[stage] || starters.scoping;
}
