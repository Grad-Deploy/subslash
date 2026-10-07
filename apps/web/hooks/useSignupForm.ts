"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { normalizeEmailAddress, validateSignup, type FieldErrors } from "@subslash/shared";
import { refreshAuth } from "@hooks/useAuth";
import { apiFetch } from "@lib/api";
import {
  confirmStatusOf,
  emailStatusFor,
  emailStatusOf,
  passwordStatusOf,
  shownStatus,
  usernameStatusOf,
  type EmailCheck,
  type LiveStatus,
} from "@lib/signup-status";
import {
  readSignupResponse,
  signupRequestBody,
  type VerificationNotice,
} from "@lib/signup-request";
import { useT } from "@lib/i18n";

const EMPTY = {
  username: "",
  email: "",
  password: "",
  passwordConfirm: "",
};

export type SignupTextField = keyof typeof EMPTY;

const ALL_TOUCHED: Record<SignupTextField, boolean> = {
  username: true,
  email: true,
  password: true,
  passwordConfirm: true,
};

/**
 * 이메일은 입력이 이만큼 멈추면 판정한다. `sean@g`처럼 치는 도중의 주소마다
 * "가입할 수 없는 이메일"을 띄우지 않기 위해서다. 칸을 벗어나면 기다리지 않는다.
 */
const EMAIL_CHECK_DELAY_MS = 500;

/**
 * 회원가입 폼의 상태와 제출. 화면(SignupForm)은 칸을 배치하고 이 훅이 돌려준 값과 처리만 쓴다.
 *
 * 여기서 하는 검사는 사용자에게 빨리 알려주기 위한 것이고, 실제 판단은
 * 서버가 다시 한다. 서버가 필드별 오류를 돌려주면 그걸 그대로 붙인다.
 */
export function useSignupForm() {
  const t = useT().auth.signup;
  const [form, setForm] = useState(EMPTY);
  const [isOver14, setIsOver14State] = useState(false);
  // 선택 항목. 비워도 가입된다.
  const [age, setAgeState] = useState("");
  const [gender, setGenderState] = useState("");
  // 입력했거나 거쳐 간 칸. 이 칸들만 입력하는 동안 판정한다.
  const [touched, setTouched] = useState<Partial<Record<SignupTextField, boolean>>>({});
  // 제출 때 받은 칸별 오류(이미 쓰는 아이디 등). 그 칸을 고치면 치운다.
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [emailCheck, setEmailCheck] = useState<EmailCheck>(null);
  // 확인 전인 계정이 쥐고 있어 가입이 막힌 주소. 주소를 고치면 치운다.
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  // 가입을 마친 뒤 보여줄 확인 메일 안내.
  const [done, setDone] = useState<VerificationNotice | null>(null);

  const normalizedEmail = normalizeEmailAddress(form.email);

  // 예전에는 아이디·빈 칸 오류가 회원가입 버튼을 누른 뒤에야 보였다. 이제 손댄
  // 칸은 입력하는 대로 판정하고, 제출 때 받은 오류가 있으면 그것을 먼저 보인다.
  const status: Record<SignupTextField, LiveStatus> = {
    username: shownStatus(
      errors.username,
      touched.username ? usernameStatusOf(form.username) : null,
    ),
    email: shownStatus(
      errors.email,
      touched.email ? emailStatusOf(normalizedEmail, emailCheck) : null,
    ),
    password: shownStatus(
      errors.password,
      touched.password ? passwordStatusOf(form.password) : null,
    ),
    passwordConfirm: shownStatus(
      errors.passwordConfirm,
      touched.passwordConfirm ? confirmStatusOf(form.password, form.passwordConfirm) : null,
    ),
  };

  useEffect(() => {
    if (!normalizedEmail) return;
    const timer = setTimeout(() => {
      setEmailCheck({ email: normalizedEmail, status: emailStatusFor(normalizedEmail) });
    }, EMAIL_CHECK_DELAY_MS);
    return () => clearTimeout(timer);
  }, [normalizedEmail]);

  /** 고치는 중인 칸의 제출 오류는 즉시 치운다. 계속 붉게 남아있으면 고쳐도 고친 것 같지 않다. */
  const clearError = (field: keyof FieldErrors) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const touch = (field: SignupTextField) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  const update = (field: SignupTextField) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    touch(field);
    if (field === "email") setPendingEmail(null);
    clearError(field);
  };

  const setAge = (value: string) => {
    setAgeState(value);
    clearError("age");
  };

  const setGender = (value: string) => {
    setGenderState(value);
    clearError("gender");
  };

  const setIsOver14 = (value: boolean) => {
    setIsOver14State(value);
    clearError("isOver14");
  };

  /** 입력이 멈추기를 기다리지 않고 이메일을 판정한다 — 칸을 벗어날 때와 제출할 때. */
  const checkEmailNow = () => {
    if (normalizedEmail) {
      setEmailCheck({ email: normalizedEmail, status: emailStatusFor(normalizedEmail) });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const values = { ...form, isOver14, age, gender };
    const { errors: localErrors, value } = validateSignup(values);
    if (!value) {
      // 칸별 문구는 입력 중 판정이 그대로 보여준다(같은 검증 함수를 쓴다). 모든
      // 칸을 손댄 것으로 치고, 글자를 치지 않는 체크박스 오류만 따로 둔다.
      setTouched(ALL_TOUCHED);
      checkEmailNow();
      setErrors((prev) => ({
        ...prev,
        isOver14: localErrors.isOver14,
        age: localErrors.age,
        gender: localErrors.gender,
      }));
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: signupRequestBody(values),
      });
      const data = await res.json().catch(() => ({}));
      const outcome = readSignupResponse(res.ok, data, normalizedEmail, t);

      if (!outcome.ok) {
        setErrors(outcome.fieldErrors);
        setFormError(outcome.formError);
        setPendingEmail(outcome.pendingEmail);
        return;
      }

      // 헤더가 곧바로 로그인 상태로 바뀌도록 공유 상태를 먼저 갱신한다. 예전에는
      // 곧장 대시보드로 보냈지만, 그러면 확인 메일을 보냈는지(또는 못 보냈는지)를
      // 알릴 곳이 없다.
      await refreshAuth();
      setDone(outcome.notice);
    } catch {
      setFormError(t.network);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    form,
    status,
    update,
    touch,
    checkEmailNow,
    age,
    setAge,
    gender,
    setGender,
    isOver14,
    setIsOver14,
    errors,
    formError,
    submitting,
    /** 지금 적힌 주소가 확인 전인 계정에 막힌 주소일 때만 그 주소. */
    blockedEmail: pendingEmail && pendingEmail === normalizedEmail ? pendingEmail : null,
    done,
    handleSubmit,
  };
}
