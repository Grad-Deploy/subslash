import React from "react";
import { ko as PAGE_TITLES } from "@lib/i18n/messages/pageTitles";

export const metadata = {
  title: PAGE_TITLES.paths["/import"],
};

export default function ImportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
