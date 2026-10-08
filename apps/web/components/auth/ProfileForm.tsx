"use client";

import React, { useState } from "react";
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
import { apiFetch } from "@lib/api";
import { HydratedForm } from "@components/ui/hydrated-form";
import { Spinner } from "../ui/spinner";
import { useKnownText, useLatestT, useT } from "@lib/i18n";

type SaveStatus = { tone: "ok" | "error"; message: string } | null;

/**
 * '내 정보'. 나이·성별을 원할 때만 적는 곳이다.
 *
 * 가입 때 묻지 않는 대신 여기로 옮겼다. 두 칸 모두 비워 둘 수 있고, 비운 채
 * 저장하면 저장돼 있던 값도 지운다.
 */
export function ProfileForm() {
  const p = useT().account.profile;
  const a = useT().account;
  const tRef = useLatestT();
  const known = useKnownText();
  const { account, loading } = useAuth();
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [status, setStatus] = useState<SaveStatus>(null);
  const [saving, setSaving] = useState(false);

  // 계정 정보가 오면 저장된 값으로 채운다. 적지 않은 항목은 빈 칸으로 둔다. 새 계정 정보가
  // 왔을 때만 채우도록 렌더링 중에 맞춘다(effect로 하면 렌더링이 한 번 더 일어난다).
  const [filledFrom, setFilledFrom] = useState<typeof account>(null);
  if (account && account !== filledFrom) {
    setFilledFrom(account);
    setAge(account.age === null ? "" : String(account.age));
    setGender(account.gender ?? "");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spinner className="size-7" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center space-y-3 py-4">
        <p className="text-sm text-muted-foreground leading-relaxed">{p.guest}</p>
        <Link
          href="/login"
          className="inline-block text-sm font-semibold text-primary underline underline-offset-4"
        >
          {p.login}
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
      const res = await apiFetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(data?.fieldErrors ?? {});
        setStatus({
          tone: "error",
          message: data?.error ?? tRef.current.account.profile.saveFailed,
        });
        return;
      }
      await refreshAuth();
      setStatus({ tone: "ok", message: tRef.current.account.profile.saved });
    } catch {
      setStatus({
        tone: "error",
        message: tRef.current.account.profile.saveNetwork,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <HydratedForm onSubmit={handleSubmit} noValidate className="space-y-5">
      <dl className="grid grid-cols-[4.5rem_1fr] gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">{a.username}</dt>
        <dd className="font-semibold">{account.username}</dd>
        <dt className="text-muted-foreground">{a.email}</dt>
        <dd className="font-semibold break-all">
          {account.email}{" "}
          {account.emailVerified ? (
            <span className="ml-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {p.verified}
            </span>
          ) : (
            <span className="ml-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              {p.unverified}
            </span>
          )}
        </dd>
      </dl>

      {/* 확인 전이라도 쓰는 데 막히는 것은 없다. 다만 주소가 본인 것인지는 아직
          모르는 상태라, 그렇게 표시하고 확인할 방법을 둔다. */}
      {!account.emailVerified && (
        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
          <p className="text-[11px] leading-relaxed text-amber-900 dark:text-amber-200">
            {p.unverifiedNote}
          </p>
          <ResendVerificationButton label={p.sendVerification} />
        </div>
      )}

      <div className="space-y-3 pt-4 border-t">
        <div className="space-y-1">
          <h2 className="text-sm font-bold">{p.optionalTitle}</h2>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{p.optionalBody}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="age" className="text-xs font-bold text-foreground">
              {p.age}
            </label>
            <Input
              id="age"
              name="age"
              type="number"
              inputMode="numeric"
              min={MIN_AGE}
              max={MAX_AGE}
              placeholder={p.agePlaceholder}
              value={age}
              onChange={(e) => {
                setAge(e.target.value);
                setErrors((prev) => ({ ...prev, age: undefined }));
              }}
              aria-invalid={Boolean(errors.age)}
            />
            {errors.age && (
              <p className="text-[11px] font-medium text-destructive" role="alert">
                {known(errors.age)}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="gender" className="text-xs font-bold text-foreground">
              {p.gender}
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
              <option value="">{p.genderNone}</option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {p.genders[option.value]}
                </option>
              ))}
            </Select>
            {errors.gender && (
              <p className="text-[11px] font-medium text-destructive" role="alert">
                {known(errors.gender)}
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
          {known(status.message)}
        </p>
      )}

      <Button type="submit" className="w-full h-11 font-bold rounded-xl" disabled={saving}>
        {saving ? p.saving : p.save}
      </Button>
    </HydratedForm>
  );
}
