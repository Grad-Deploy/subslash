import React from "react";
import { LoginScreen } from "@components/auth/LoginScreen";
import { ko as PAGE_TITLES } from "@lib/i18n/messages/pageTitles";

export const metadata = {
  title: PAGE_TITLES.paths["/login"],
};

export default function LoginPage() {
  return <LoginScreen />;
}
