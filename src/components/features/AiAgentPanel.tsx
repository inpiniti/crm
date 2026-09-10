"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  Bot,
  User,
  Loader2,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/common/Markdown";
import { useDetailHeader } from "@/components/layout/DetailHeaderContext";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content: `안녕하세요! **CRM AI 에이전트**입니다. 
등록해 두신 프로젝트, 업무, 회사, 사람, 작업 일지 데이터를 기반으로 무엇이든 질문해 주세요!`,
  },
];

const QUICK_PROMPTS = [
  { label: "가스링크 프로젝트 설명", prompt: "가스링크 프로젝트에 대해서 설명해줘" },
  { label: "오늘 진행 중인 업무 요약", prompt: "현재 진행 중인 주요 업무와 우선순위를 알려줘" },
  { label: "최근 작업 일지 브리핑", prompt: "최근 작성된 작업 일지들을 간단히 브리핑해줘" },
];

export function AiAgentPanel() {
  const { isAiOpen, setIsAiOpen } = useDetailHeader();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isAiOpen) {
      scrollToBottom();
    }
  }, [messages, isAiOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();
    // 임시 빈 어시스턴트 메시지 추가
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("답변 생성 요청에 실패했습니다.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, content: accumulated } : msg
          )
        );
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "오류가 발생했습니다.";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: `⚠️ **응답 오류**: ${errMsg}` }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages(INITIAL_MESSAGES);
    setInput("");
  };

  if (!isAiOpen) {
    return null;
  }

  return (
    <aside
      className="flex h-full w-[350px] shrink-0 flex-col border-l border-border bg-card/30 backdrop-blur-sm transition-all duration-200 select-none z-20"
      aria-label="AI 에이전트 질문창"
    >
      {/* 1. 패널 상단 헤더 */}
      <div className="flex h-13 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-blue/10 text-blue">
            <Sparkles className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[13.5px] font-bold text-foreground">AI Agent</span>
            <span className="text-[11px] text-text-3 font-medium">CRM 스마트 어시스턴트</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleReset}
            className="size-7 rounded-md text-text-3 hover:text-foreground"
            title="대화 초기화"
          >
            <RotateCcw className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsAiOpen(false)}
            className="size-7 rounded-md text-text-3 hover:text-foreground"
            title="패널 닫기"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* 2. 대화 메시지 피드 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[13px] select-text">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-weak text-blue mt-0.5">
                <Bot className="size-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed text-[13px] ${
                m.role === "user"
                  ? "bg-blue text-white rounded-br-xs shadow-sm font-medium"
                  : "bg-muted/80 text-foreground rounded-bl-xs border border-border/50"
              }`}
            >
              {m.content ? (
                m.role === "user" ? (
                  <div className="whitespace-pre-wrap break-words text-white select-text">
                    {m.content}
                  </div>
                ) : (
                  <div className="markdown-content">
                    <Markdown>{m.content}</Markdown>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-1.5 py-1 text-text-3">
                  <Loader2 className="size-3.5 animate-spin text-blue" />
                  <span className="text-xs">생각하는 중...</span>
                </div>
              )}
            </div>

            {m.role === "user" && (
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-text-3 mt-0.5">
                <User className="size-3.5" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. 추천 퀵 프롬프트 칩 */}
      {messages.length <= 2 && (
        <div className="px-3 pb-2 space-y-1">
          <div className="px-1 text-[11px] font-medium text-text-3">추천 질문</div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q.prompt)}
                className="flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11.5px] text-text-2 hover:border-blue hover:text-blue hover:bg-blue-weak/30 transition-all cursor-pointer text-left"
              >
                <span>{q.label}</span>
                <ChevronRight className="size-3 opacity-60" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. 메시지 입력창 */}
      <div className="border-t border-border p-3 bg-card/50">
        <div className="relative flex flex-col rounded-xl border border-border bg-background focus-within:border-blue focus-within:ring-1 focus-within:ring-blue transition-all shadow-2xs">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="AI에게 무엇이든 물어보세요... (Enter 전송)"
            rows={2}
            className="w-full resize-none bg-transparent px-3 py-2.5 text-[13px] text-foreground placeholder:text-text-3/60 focus:outline-none"
          />

          <div className="flex items-center justify-between border-t border-border/40 px-2.5 py-1.5 bg-muted/20">
            <span className="text-[11px] text-text-3 font-normal">
              Shift+Enter 줄바꿈
            </span>
            <Button
              size="icon-sm"
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="size-7 rounded-lg bg-blue text-white hover:bg-blue-dark disabled:opacity-30 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
