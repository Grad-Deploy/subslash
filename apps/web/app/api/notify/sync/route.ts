import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@lib/db";
import { mirroredSubscriptions, users } from "@lib/schema";
import { deleteUserCompletely, userFromRequest } from "@lib/notify-server";

/** Only the fields the reminder needs — no cancel guides, categories or icons. */
interface MirrorInput {
  clientId: string;
  name: string;
  amount: number;
  currency: string;
  billingDay: number;
  billingCycle: string;
  billingMonth: number | null;
}

const MAX_SUBSCRIPTIONS = 100;

function sanitize(raw: unknown): MirrorInput | null {
  if (typeof raw !== "object" || raw === null) return null;
  const item = raw as Record<string, unknown>;

  const clientId = typeof item.id === "string" ? item.id.slice(0, 100) : null;
  const name = typeof item.name === "string" ? item.name.trim().slice(0, 120) : null;
  const amount =
    typeof item.amount === "number" && Number.isFinite(item.amount) ? item.amount : null;
  const billingDay =
    Number.isInteger(item.billingDay) &&
    (item.billingDay as number) >= 1 &&
    (item.billingDay as number) <= 31
      ? (item.billingDay as number)
      : null;

  const billingMonth =
    Number.isInteger(item.billingMonth) &&
    (item.billingMonth as number) >= 1 &&
    (item.billingMonth as number) <= 12
      ? (item.billingMonth as number)
      : null;

  if (!clientId || !name || amount === null || billingDay === null) return null;

  return {
    clientId,
    name,
    amount,
    currency: item.currency === "USD" ? "USD" : "KRW",
    billingDay,
    billingCycle: item.billingCycle === "yearly" ? "yearly" : "monthly",
    billingMonth,
  };
}

/**
 * Replaces the caller's mirror with whatever the browser just sent.
 *
 * The mirror is strictly downstream of localStorage, so there is no merge step
 * and no conflict resolution: the last device to sync defines the server state.
 * Killed subscriptions are simply absent from the payload and disappear here.
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await userFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!Array.isArray(body?.subscriptions)) {
      return NextResponse.json({ error: "subscriptions must be an array" }, { status: 400 });
    }

    const items: MirrorInput[] = (body.subscriptions as unknown[])
      .slice(0, MAX_SUBSCRIPTIONS)
      .map(sanitize)
      .filter((item): item is MirrorInput => item !== null);

    const db = getDb();
    const now = new Date().toISOString();

    await db.delete(mirroredSubscriptions).where(eq(mirroredSubscriptions.userId, user.id));
    if (items.length > 0) {
      await db
        .insert(mirroredSubscriptions)
        .values(items.map((item) => ({ ...item, userId: user.id, updatedAt: now })));
    }
    await db.update(users).set({ lastSyncedAt: now }).where(eq(users.id, user.id));

    return NextResponse.json({
      synced: items.length,
      skipped: body.subscriptions.length - items.length,
      verified: Boolean(user.verifiedAt),
    });
  } catch (error) {
    console.error("[api/notify/sync]", error);
    return NextResponse.json({ error: "동기화에 실패했습니다." }, { status: 500 });
  }
}

/** Lets the client show the current opt-in state without exposing the mirror. */
export async function GET(request: NextRequest) {
  try {
    const user = await userFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({
      email: user.email,
      verified: Boolean(user.verifiedAt),
      reminderDays: user.reminderDays,
      lastSyncedAt: user.lastSyncedAt,
    });
  } catch (error) {
    console.error("[api/notify/sync]", error);
    return NextResponse.json({ error: "상태를 불러오지 못했습니다." }, { status: 500 });
  }
}

/** Opting out from inside the app: same effect as the email unsubscribe link. */
export async function DELETE(request: NextRequest) {
  try {
    const user = await userFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await deleteUserCompletely(user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/notify/sync]", error);
    return NextResponse.json({ error: "알림 해제에 실패했습니다." }, { status: 500 });
  }
}
