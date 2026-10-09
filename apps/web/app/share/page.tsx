"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AutoImportModal } from "../../components/import/AutoImportModal";
import { Button } from "../../components/ui/button";
import { Spinner } from "../../components/ui/spinner";
import { useT } from "../../lib/i18n";
import { Inbox } from "lucide-react";

/**
 * PWA share target (see public/manifest.json). Android hands the shared
 * payment SMS / receipt over as query params; we feed it straight into the
 * auto-import parser.
 */
function ShareReceiver() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(true);
  const s = useT().sharedImport;

  const sharedText = [searchParams.get("title"), searchParams.get("text"), searchParams.get("url")]
    .filter(Boolean)
    .join("\n")
    .trim();

  useEffect(() => {
    if (!sharedText) {
      router.replace("/subs");
    }
  }, [sharedText, router]);

  const handleClose = () => {
    setIsOpen(false);
    router.replace("/subs");
  };

  if (!sharedText) return null;

  return (
    <div className="space-y-4 text-center py-10">
      <Inbox className="mx-auto size-10 text-muted-foreground" aria-hidden />
      <h1 className="text-xl font-black tracking-tight">{s.title}</h1>
      <p className="text-sm text-muted-foreground">{s.body}</p>
      <Button variant="outline" onClick={handleClose}>
        {s.toList}
      </Button>

      <AutoImportModal isOpen={isOpen} onClose={handleClose} initialSmsText={sharedText} />
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner className="size-8" />
        </div>
      }
    >
      <ShareReceiver />
    </Suspense>
  );
}
