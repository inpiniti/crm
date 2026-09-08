"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface HeaderInfo {
  title?: string;
  subtitle?: string;
  badge?: string;
}

interface DetailHeaderContextType {
  header: HeaderInfo;
  setHeader: (info: HeaderInfo) => void;
  clearHeader: () => void;
  isAiOpen: boolean;
  setIsAiOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  toggleAi: () => void;
}

const DetailHeaderContext = createContext<DetailHeaderContextType | undefined>(undefined);

export function DetailHeaderProvider({ children }: { children: React.ReactNode }) {
  const [header, setHeader] = useState<HeaderInfo>({});
  const [isAiOpen, setIsAiOpen] = useState<boolean>(true);

  // 로컬 스토리지에서 AI 패널 상태 복원 (기본값 true)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("crm_ai_panel_open");
      if (saved !== null) {
        setIsAiOpen(saved === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSetIsAiOpen = (val: boolean | ((prev: boolean) => boolean)) => {
    setIsAiOpen((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      try {
        localStorage.setItem("crm_ai_panel_open", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleAi = () => handleSetIsAiOpen((prev) => !prev);
  const clearHeader = () => setHeader({});

  return (
    <DetailHeaderContext.Provider
      value={{
        header,
        setHeader,
        clearHeader,
        isAiOpen,
        setIsAiOpen: handleSetIsAiOpen,
        toggleAi,
      }}
    >
      {children}
    </DetailHeaderContext.Provider>
  );
}

export function useDetailHeader() {
  const context = useContext(DetailHeaderContext);
  if (!context) {
    throw new Error("useDetailHeader must be used within a DetailHeaderProvider");
  }
  return context;
}

/**
 * 페이지 컴포넌트에서 상단바 제목을 선언적으로 설정하는 헬퍼 컴포넌트
 */
export function DetailHeaderSetter({
  title,
  subtitle,
  badge,
}: {
  title?: string;
  subtitle?: string;
  badge?: string;
}) {
  const { setHeader, clearHeader } = useDetailHeader();

  useEffect(() => {
    setHeader({ title, subtitle, badge });
    return () => clearHeader();
  }, [title, subtitle, badge]);

  return null;
}
