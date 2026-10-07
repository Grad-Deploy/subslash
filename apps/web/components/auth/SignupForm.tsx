"use client";

import Link from "next/link";
import { PASSWORD_MIN, USERNAME_MAX, USERNAME_MIN } from "@subslash/shared";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { HydratedForm } from "@components/ui/hydrated-form";
import { useSignupForm } from "@hooks/useSignupForm";
import { ResendVerificationButton } from "./ResendVerificationButton";
import { SignupDone } from "./SignupDone";
import { Field, OptionalProfileFields, Over14Checkbox, statusProps } from "./SignupFields";

/**
 * 회원가입 폼. 상태와 제출은 useSignupForm이 맡고, 여기는 칸을 배치한다.
 */
export function SignupForm() {
  const signup = useSignupForm();
  const { form, status, update, touch, errors } = signup;

  if (signup.done) return <SignupDone notice={signup.done} />;

  return (
    <HydratedForm onSubmit={signup.handleSubmit} noValidate className="space-y-4">
      <Field label="아이디" htmlFor="username" status={status.username}>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          placeholder={`영문 소문자·숫자·밑줄 ${USERNAME_MIN}~${USERNAME_MAX}자`}
          value={form.username}
          onChange={(e) => update("username")(e.target.value)}
          onBlur={() => touch("username")}
          {...statusProps("username", status.username)}
        />
      </Field>

      <Field label="이메일" htmlFor="email" status={status.email}>
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
            직접 가입해 두었다면{" "}
            <Link href="/login" className="font-semibold text-primary underline underline-offset-4">
              로그인
            </Link>
            하면 됩니다. 가입한 적이 없다면, 이 주소로 확인 메일을 받아 &lsquo;제가 가입하지
            않았어요&rsquo;를 누르세요. 그 계정이 지워지고 이 주소로 가입할 수 있습니다.
          </p>
          <ResendVerificationButton email={signup.blockedEmail} label="이 주소로 확인 메일 받기" />
        </div>
      )}

      <Field label="비밀번호" htmlFor="password" status={status.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder={`${PASSWORD_MIN}자 이상`}
          value={form.password}
          onChange={(e) => update("password")(e.target.value)}
          onBlur={() => touch("password")}
          {...statusProps("password", status.password)}
        />
      </Field>

      <Field label="비밀번호 확인" htmlFor="passwordConfirm" status={status.passwordConfirm}>
        <Input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          placeholder="위와 같은 비밀번호를 한 번 더"
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
          {signup.formError}
        </p>
      )}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        가입하면 아이디·이메일과 비밀번호의 해시를 저장합니다. 무엇을 얼마나 보관하고 어떻게
        지우는지는{" "}
        <Link href="/privacy" className="font-semibold text-primary underline underline-offset-4">
          개인정보처리방침
        </Link>
        에 있습니다.
      </p>

      <Button
        type="submit"
        className="w-full h-11 font-bold rounded-xl"
        disabled={signup.submitting}
      >
        {signup.submitting ? "가입하는 중..." : "회원가입"}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-semibold text-primary underline underline-offset-4">
          로그인
        </Link>
      </p>
    </HydratedForm>
  );
}
