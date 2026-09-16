"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  getAccountIndexAction,
  setAccountIndexAction,
} from "@/app/actions/account";

export const DEFAULT_GOOGLE_ACCOUNTS = [
  "younginpiniti",
  "wjdOr12",
  "youngkyun974",
  "potatomapyg",
  "youngkyun001",
  "youngkyun089",
  "01.yg.jung",
  "02.yg.jung",
  "03.yg.jung",
  "04.yg.jung",
];

const LOCAL_STORAGE_KEY = "crm_google_accounts";

function getLocalAccounts(): string[] {
  if (typeof window === "undefined") return DEFAULT_GOOGLE_ACCOUNTS;
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(DEFAULT_GOOGLE_ACCOUNTS)
      );
      return DEFAULT_GOOGLE_ACCOUNTS;
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : DEFAULT_GOOGLE_ACCOUNTS;
  } catch {
    return DEFAULT_GOOGLE_ACCOUNTS;
  }
}

export function GoogleAccountSwitcher() {
  const [accounts, setAccounts] = useState<string[]>(DEFAULT_GOOGLE_ACCOUNTS);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    // 로컬 스토리지 계정 목록 동기화
    queueMicrotask(() => {
      setAccounts(getLocalAccounts());
    });

    // 서버에서 현재 선택된 계정 인덱스 가져오기
    getAccountIndexAction()
      .then((idx) => {
        if (typeof idx === "number" && !isNaN(idx)) {
          setCurrentIndex(idx);
        }
      })
      .catch((err) => {
        console.error("Failed to load account index from server:", err);
      });
  }, []);

  const total = accounts.length || DEFAULT_GOOGLE_ACCOUNTS.length;
  const safeIndex = ((currentIndex % total) + total) % total;
  const currentAccount = accounts[safeIndex] || DEFAULT_GOOGLE_ACCOUNTS[0];

  const handleNext = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIdx = (safeIndex + 1) % total;
    setCurrentIndex(nextIdx);

    // Supabase 서버에 현재 선택된 계정 인덱스 저장
    try {
      await setAccountIndexAction(nextIdx);
    } catch (err) {
      console.error("Failed to save account index to server:", err);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentAccount);
      setCopied(true);
      toast.success(`계정이 복사되었습니다: ${currentAccount}`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("클립보드 복사에 실패했습니다.");
    }
  };

  return (
    <div className="border-t border-border px-3 py-2 text-text-2">
      {/* 회색의 작은 글씨 */}
      <div className="text-[10.5px] font-medium text-text-3 tracking-tight mb-1">
        google account
      </div>

      <div className="flex items-center justify-between gap-1.5">
        {/* 두껍게, 클릭 시 카피 */}
        <button
          type="button"
          onClick={handleCopy}
          title="클릭 시 계정명 복사"
          className="group flex flex-1 min-w-0 items-center gap-1 text-left rounded px-1 -mx-1 py-0.5 hover:bg-hover transition-colors cursor-pointer"
        >
          <span className="truncate text-[13px] font-bold text-foreground group-hover:text-blue transition-colors">
            {currentAccount}
          </span>
          {copied ? (
            <Check className="size-3 text-emerald-500 shrink-0 animate-in fade-in" />
          ) : (
            <Copy className="size-3 text-text-3 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
          )}
        </button>

        {/* [ next ] 버튼 */}
        <button
          type="button"
          onClick={handleNext}
          className="shrink-0 h-5 px-1.5 rounded text-[11px] font-medium border border-border/80 bg-background/50 text-text-2 hover:bg-hover hover:border-blue/50 hover:text-blue transition-all cursor-pointer"
        >
          next
        </button>
      </div>
    </div>
  );
}
