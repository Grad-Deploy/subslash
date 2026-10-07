"use client";

import Link from "next/link";
import { PASSWORD_MIN, USERNAME_MAX, USERNAME_MIN } from "@subslash/shared";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { HydratedForm } from "@components/ui/hydrated-form";
import { useSignupForm } from "@hooks/useSignupForm";
import { useKnownText, useT } from "@lib/i18n";
import { ResendVerificationButton } from "./ResendVerificationButton";
import { SignupDone } from "./SignupDone";
import { Field, OptionalProfileFields, Over14Checkbox, statusProps } from "./SignupFields";

/**
 * 회원가입 폼. 상태와 제출은 useSignupForm이 맡고, 여기는 칸을 배치한다.
 */
export function SignupForm() {
  const signup = useSignupForm();
  const { form, status, update, touch, errors } = signup;
  const t = useT().auth.signup;
  const known = useKnownText();

  if (signup.done) return <SignupDone notice={signup.done} />;

  return (
    <HydratedForm onSubmit={signup.handleSubmit} noValidate className="space-y-4">
      <Field label={t.username} htmlFor="username" status={status.username}>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          placeholder={t.usernamePlaceholder(USERNAME_MIN, USERNAME_MAX)}
          value={form.username}
          onChange={(e) => update("username")(e.target.value)}
          onBlur={() => touch("username")}
          {...statusProps("username", status.username)}
        />
      </Field>

      <Field label={t.email} htmlFor="email" status={status.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@naver.com"
          value={form.email}
          onChange={(e) => update("email")(e.target.value)}
          onBlur={() => {
            touch("email");
            signup.checkEmailNow();
          }}
          {...statusProps("email", status.email)}
        />
      </Field>

      {/* 남이 이 주소로 먼저 가입했을 수 있다. 주소의 주인이면 확인 메일에서 그 계정을
          지울 수 있다. 직접 가입해 두고 잊은 것이라면 로그인하면 된다. */}
      {signup.blockedEmail && (
        <div className="space-y-2 rounded-xl border border-dashed p-3 text-[11px] leading-relaxed text-muted-foreground">
          <p>
            {t.blockedBefore}
            <Link href="/login" className="font-semibold text-primary underline underline-offset-4">
              {t.blockedLogin}
            </Link>
            {t.blockedAfter}
          </p>
          <ResendVerificationButton email={signup.blockedEmail} label={t.blockedResend} />
        </div>
      )}

      <Field label={t.password} htmlFor="password" status={status.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder={t.passwordPlaceholder(PASSWORD_MIN)}
          value={form.password}
          onChange={(e) => update("password")(e.target.value)}
          onBlur={() => touch("password")}
          {...statusProps("password", status.password)}
        />
      </Field>

      <Field label={t.passwordConfirm} htmlFor="passwordConfirm" status={status.passwordConfirm}>
        <Input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          placeholder={t.passwordConfirmPlaceholder}
          value={form.passwordConfirm}
          onChange={(e) => update("passwordConfirm")(e.target.value)}
          onBlur={() => touch("passwordConfirm")}
          {...statusProps("passwordConfirm", status.passwordConfirm)}
        />
      </Field>

      <OptionalProfileFields
        age={signup.age}
        onAgeChange={signup.setAge}
        gender={signup.gender}
        onGenderChange={signup.setGender}
        ageError={errors.age}
        genderError={errors.gender}
      />

      <Over14Checkbox
        checked={signup.isOver14}
        onChange={signup.setIsOver14}
        error={errors.isOver14}
      />

      {signup.formError && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {known(signup.formError)}
        </p>
      )}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {t.storageBefore}
        <Link href="/privacy" className="font-semibold text-primary underline underline-offset-4">
          {t.storagePrivacy}
        </Link>
        {t.storageAfter}
      </p>

      <Button
        type="submit"
        className="w-full h-11 font-bold rounded-xl"
        disabled={signup.submitting}
      >
        {signup.submitting ? t.submitting : t.submit}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        {t.haveAccount}{" "}
        <Link href="/login" className="font-semibold text-primary underline underline-offset-4">
          {t.login}
        </Link>
      </p>
    </HydratedForm>
  );
}
