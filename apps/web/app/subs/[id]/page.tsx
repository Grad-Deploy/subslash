"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SubscriptionDetail } from "../../../components/subscription/SubscriptionDetail";

export default function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin text-3xl">✂️</div>
      </div>
    );
  }

  return (
    <SubscriptionDetail
      id={id}
      className="max-w-2xl mx-auto"
      onClose={() => router.back()}
      closeLabel="← 뒤로 가기"
      onLeave={() => router.push("/subs")}
    />
  );
}
