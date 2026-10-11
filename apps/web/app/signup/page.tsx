import React from "react";
import { SignupScreen } from "@components/auth/SignupScreen";
import { ko as PAGE_TITLES } from "@lib/i18n/messages/pageTitles";

export const metadata = {
  title: PAGE_TITLES.paths["/signup"],
};

export default function SignupPage() {
  return <SignupScreen />;
}
