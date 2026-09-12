"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  GENDER_OPTIONS,
  MAX_AGE,
  MIN_AGE,
  validateProfile,
  type ProfileErrors,
} from "@subslash/shared";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import { Button } from "@components/ui/button";
import { refreshAuth, useAuth } from "@hooks/useAuth";
import { ResendVerificationButton } from "./ResendVerificationButton";

type SaveStatus = { tone: "ok" | "error"; message: string } | null;

/**
 * '내 정보'. 나이·성별을 원할 때만 적는 곳이다.
 *
 * 가입 때 묻지 않는 대신 여기로 옮겼다. 두 칸 모두 비워 둘 수 있고, 비운 채
 * 저장하면 저장돼 있던 값도 지운다.
 */
export function ProfileForm() {
  const { account, loading } = useAuth();
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [status, setStatus] = useState<SaveStatus>(null);
  const [saving, setSaving] = useState(false);

  // 계정 정보가 오면 저장된 값으로 채운다. 적지 않은 항목은 빈 칸으로 둔다.
  useEffect(() => {
    if (!account) return;
    setAge(account.age === null ? "" : String(account.age));
    setGender(account.gender ?? "");
  }, [account]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin text-2xl">✂️</div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center space-y-3 py-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          로그인한 계정에만 있는 화면입니다. 로그인하지 않아도 SubSlash의 모든 기능은 그대로 쓸 수
          있습니다.
        </p>
        <Link
          href="/login"
          className="inline-block text-sm font-semibold text-primary underline underline-offset-4"
        >
          로그인하기
        </Link>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);

    const { errors: localErrors, value } = validateProfile({ age, gender });
    if (!value) {
      setErrors(localErrors);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(value),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(data?.fieldErrors ?? {});
        setStatus({ tone: "error", message: data?.error ?? "저장하지 못했습니다." });
        return;
      }
      await refreshAuth();
      setStatus({ tone: "ok", message: "저장했습니다." });
    } catch {
      setStatus({
        tone: "error",
        message: "네트워크에 문제가 있어 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <dl className="grid grid-cols-[4.5rem_1fr] gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">아이디</dt>
        <dd className="font-semibold">{account.username}</dd>
        <dt className="text-muted-foreground">이메일</dt>
        <dd className="font-semibold break-all">
          {account.email}{" "}
          {account.emailVerified ? (
            <span className="ml-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              확인됨
            </span>
          ) : (
            <span className="ml-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              미확인
            </span>
          )}
        </dd>
      </dl>

      {/* 확인 전이라도 쓰는 데 막히는 것은 없다. 다만 주소가 본인 것인지는 아직
          모르는 상태라, 그렇게 표시하고 확인할 방법을 둔다. */}
      {!account.emailVerified && (
        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
          <p className="text-[11px] leading-relaxed text-amber-900 dark:text-amber-200">
            이 이메일이 본인 것인지 아직 확인하지 않았습니다. 확인 메일의 링크에서
            &lsquo;맞아요&rsquo;를 누르면 확인됩니다. 확인 전에도 모든 기능을 그대로 쓸 수 있습니다.
          </p>
          <ResendVerificationButton label="확인 메일 보내기" />
        </div>
      )}

      <div className="space-y-3 pt-4 border-t">
        <div className="space-y-1">
          <h2 className="text-sm font-bold">나이·성별 (선택)</h2>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            적지 않아도 모든 기능을 그대로 쓸 수 있습니다. 지금은 어떤 계산에도 쓰이지 않고, 나중에
            &lsquo;비슷한 사용자와 비교&rsquo; 기능이 생기면 그때 따로 동의를 받은 경우에만
            쓰입니다. 칸을 비우고 저장하면 지워집니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="age" className="text-xs font-bold text-foreground">
              나이
            </label>
            <Input
              id="age"
              name="age"
              type="number"
              inputMode="numeric"
              min={MIN_AGE}
              max={MAX_AGE}
              placeholder="만 나이"
              value={age}
              onChange={(e) => {
                setAge(e.target.value);
                setErrors((prev) => ({ ...prev, age: undefined }));
              }}
              aria-invalid={Boolean(errors.age)}
            />
            {errors.age && (
              <p className="text-[11px] font-medium text-destructive" role="alert">
                {errors.age}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="gender" className="text-xs font-bold text-foreground">
              성별
            </label>
            <Select
              id="gender"
              name="gender"
              value={gender}
              onChange={(e) => {
                setGender(e.target.value);
                setErrors((prev) => ({ ...prev, gender: undefined }));
              }}
              aria-invalid={Boolean(errors.gender)}
            >
              <option value="">적지 않음</option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            {errors.gender && (
              <p className="text-[11px] font-medium text-destructive" role="alert">
                {errors.gender}
              </p>
            )}
          </div>
        </div>
      </div>

      {status && (
        <p
          role={status.tone === "error" ? "alert" : "status"}
          className={
            status.tone === "ok"
              ? "text-sm font-medium text-emerald-600 dark:text-emerald-400"
              : "text-sm font-medium text-destructive"
          }
        >
          {status.message}
        </p>
      )}

      <Button type="submit" className="w-full h-11 font-bold rounded-xl" disabled={saving}>
        {saving ? "저장하는 중..." : "저장하기"}
      </Button>
    </form>
  );
}
