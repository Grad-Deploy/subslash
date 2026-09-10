"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export interface AuthAccount {
  id: string;
  username: string;
  email: string;
  age: number;
  gender: string;
  createdAt: string;
}

export interface AuthState {
  account: AuthAccount | null;
  /** 아직 서버에 물어보는 중. "로그인 안 됨"과 구분해야 헤더가 깜빡이지 않는다. */
  loading: boolean;
}

/**
 * 로그인 상태.
 *
 * 세션은 httpOnly 쿠키에 있어 자바스크립트가 읽을 수 없다. 그래서 상태는
 * 서버에 물어봐서만 알 수 있고, localStorage에 복사해두지 않는다 — 복사본은
 * 로그아웃 뒤에도 남아 "로그인된 것처럼" 보이게 만든다.
 *
 * 상태를 훅 안의 지역 변수가 아니라 모듈 하나에 모아두는 이유는, 로그인 폼과
 * 헤더가 서로 다른 컴포넌트이기 때문이다. 각자 자기 상태를 들고 있으면 가입에
 * 성공해도 헤더는 그 사실을 모른 채 "로그인" 버튼을 계속 보여준다.
 */

const INITIAL: AuthState = { account: null, loading: true };
const SERVER_SNAPSHOT: AuthState = { account: null, loading: true };

let cache: AuthState = INITIAL;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): AuthState {
  return cache;
}

function getServerSnapshot(): AuthState {
  return SERVER_SNAPSHOT;
}

/**
 * 서버에 지금 로그인 상태를 다시 물어본다.
 *
 * 이미 물어보는 중이면 그 요청을 함께 기다린다. 헤더와 폼이 동시에 부르는
 * 일이 흔한데, 그때마다 요청을 따로 보낼 이유가 없다.
 */
export async function refreshAuth(): Promise<void> {
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "same-origin" });
      const data = await res.json();
      cache = { account: data?.account ?? null, loading: false };
    } catch {
      cache = { account: null, loading: false };
    } finally {
      inflight = null;
      emit();
    }
  })();

  return inflight;
}

/** 로그아웃하고 공유 상태를 즉시 비운다. */
export async function logoutAuth(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
  } finally {
    cache = { account: null, loading: false };
    emit();
  }
}

export function useAuth() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    // 아직 한 번도 물어본 적이 없을 때만. 화면을 옮길 때마다 다시 묻지 않는다.
    if (cache.loading) void refreshAuth();
  }, []);

  const logout = useCallback(() => logoutAuth(), []);

  return { account: state.account, loading: state.loading, refresh: refreshAuth, logout };
}
