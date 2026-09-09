"use client";

import React, { useState } from "react";
import { useStore } from "../../lib/store";
import { SHOW_INBOX_PREVIEW } from "../../lib/flags";
import { AccountProvider, ACCOUNT_PROVIDERS, sumMonthlyKRW } from "@subslash/shared";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Badge } from "../ui/badge";
import { EmailDomainInput } from "../ui/email-domain-input";
import { AutoImportModal } from "../import/AutoImportModal";
import { useExchangeRate } from "../../hooks/useExchangeRate";

interface AccountHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountHubModal({ isOpen, onClose }: AccountHubModalProps) {
  const { accounts, addAccount, deleteAccount, subscriptions } = useStore();
  const rate = useExchangeRate();
  const [isAdding, setIsAdding] = useState(false);
  const [scanAccountId, setScanAccountId] = useState<string | null>(null);
  const [provider, setProvider] = useState<AccountProvider>("google");
  const [name, setName] = useState("");
  const [emailOrId, setEmailOrId] = useState("");

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !emailOrId.trim()) return;

    addAccount({
      provider,
      name: name.trim(),
      emailOrId: emailOrId.trim(),
    });

    setName("");
    setEmailOrId("");
    setIsAdding(false);
  };

  // Picking a provider only prefills the manual form. It must never invent an
  // address: the stored account is shown as "log in with this account" on the
  // cancellation guide, so a made-up one would send the user to a dead end.
  const handleQuickAdd = (p: (typeof ACCOUNT_PROVIDERS)[number]) => {
    setProvider(p.id as AccountProvider);
    setName("");
    setEmailOrId(p.defaultDomain);
    setIsAdding(true);
  };

  const getProviderBadge = (p: AccountProvider) => {
    switch (p) {
      case "google":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">🌐 Google</Badge>;
      case "kakao":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">🟡 카카오</Badge>
        );
      case "naver":
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">🟢 네이버</Badge>
        );
      case "apple":
        return (
          <Badge className="bg-zinc-500/10 text-zinc-600 border-zinc-500/20">🍎 Apple ID</Badge>
        );
      default:
        return <Badge variant="outline">📧 이메일</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>👤</span>
            <span>사용 계정 연동 및 관리 허브</span>
          </DialogTitle>
          <DialogDescription>
            구독 서비스에 로그인할 때 사용하는 계정을 등록하면, 해지 시 올바른 계정으로 즉시
            로그인하여 손쉽게 해지할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Quick Connect / Simulation */}
          <div className="p-4 bg-muted/40 rounded-2xl border space-y-3">
            <div className="space-y-1">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                제공자 선택해서 추가
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                제공자를 고르면 아래 입력란이 열립니다. 평소 그 서비스에 로그인할 때 쓰는 실제
                주소를 입력해주세요.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {ACCOUNT_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleQuickAdd(p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-card text-xs font-medium hover:bg-secondary hover:border-primary/40 transition-all active:scale-95"
                >
                  <span>{p.icon}</span>
                  <span>{p.name} 추가</span>
                </button>
              ))}
            </div>
          </div>

          {/* Accounts List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm">연동된 계정 목록 ({accounts.length})</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAdding(!isAdding)}
                className="text-xs"
              >
                {isAdding ? "취소" : "+ 직접 계정 입력"}
              </Button>
            </div>

            {isAdding && (
              <form
                onSubmit={handleCreateAccount}
                className="p-4 border rounded-2xl bg-card space-y-3"
              >
                <div className="font-bold text-xs">새 계정 정보 입력</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">로그인 제공자</label>
                    <Select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value as AccountProvider)}
                    >
                      <option value="google">Google</option>
                      <option value="kakao">카카오 (Kakao)</option>
                      <option value="naver">네이버 (Naver)</option>
                      <option value="apple">Apple ID</option>
                      <option value="email">일반 이메일</option>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">계정 칭호 / 이름</label>
                    <Input
                      placeholder="예: 내 구글 본계정"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">로그인 이메일 / ID</label>
                  <EmailDomainInput
                    value={emailOrId}
                    onChange={(full, local) => {
                      setEmailOrId(full);
                      if (!name) {
                        setName(local);
                      }
                    }}
                    onProviderChange={(p) => setProvider(p)}
                    placeholderId="아이디 입력"
                    required
                  />
                </div>
                <Button type="submit" size="sm" className="w-full">
                  계정 등록하기
                </Button>
              </form>
            )}

            {accounts.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-2xl text-xs text-muted-foreground">
                등록된 연동 계정이 없습니다. 위에서 제공자를 고르거나 &lsquo;직접 계정 입력&rsquo;을
                눌러 등록해보세요.
              </div>
            ) : (
              <div className="space-y-2.5">
                {accounts.map((acc) => {
                  const linkedSubs = subscriptions.filter(
                    (s) => s.linkedAccountId === acc.id && s.status === "active",
                  );
                  const totalMonthly = sumMonthlyKRW(linkedSubs, rate);

                  return (
                    <div
                      key={acc.id}
                      className="p-4 border rounded-2xl bg-card flex flex-col gap-2 hover:border-primary/40 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          {getProviderBadge(acc.provider)}
                          <div>
                            <div className="font-bold text-sm leading-none">{acc.name}</div>
                            <div className="text-xs text-muted-foreground font-mono mt-1">
                              {acc.emailOrId}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Per-account scan only drives the simulated inbox preview. */}
                          {SHOW_INBOX_PREVIEW && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                              onClick={() => setScanAccountId(acc.id)}
                              title="이 계정으로 예시 영수증 스캔 미리보기 실행"
                            >
                              <span>🧪</span> 예시 스캔
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:bg-destructive/10"
                            onClick={() => deleteAccount(acc.id)}
                          >
                            삭제
                          </Button>
                        </div>
                      </div>

                      <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          연결된 활성 구독:{" "}
                          <strong className="text-foreground">{linkedSubs.length}개</strong>
                          {linkedSubs.length > 0 && (
                            <span className="ml-1.5 text-[11px] opacity-80">
                              ({linkedSubs.map((s) => s.name).join(", ")})
                            </span>
                          )}
                        </span>
                        <span>
                          월{" "}
                          <strong className="text-foreground">
                            ₩{totalMonthly.toLocaleString()}
                          </strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {scanAccountId && (
        <AutoImportModal
          isOpen={!!scanAccountId}
          onClose={() => setScanAccountId(null)}
          defaultAccountId={scanAccountId}
        />
      )}
    </Dialog>
  );
}
