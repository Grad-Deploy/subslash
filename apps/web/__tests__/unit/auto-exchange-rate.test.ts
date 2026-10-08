import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStore } from "@lib/store";
import { refreshExchangeRate } from "../../hooks/useAutoExchangeRate";

const usd = {
  id: "sub-chatgpt",
  name: "ChatGPT",
  amount: 20,
  currency: "USD",
  billingDay: 5,
  billingCycle: "monthly",
  category: "ai",
  status: "active",
  createdAt: "2026-09-01T00:00:00.000Z",
};

function respondWith(rate: unknown, ok = true) {
  const fetchMock = vi.fn(async () => ({ ok, json: async () => ({ rate }) }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  useStore.setState({
    subscriptions: [usd] as never,
    exchangeRate: { rate: null, source: "default", updatedAt: null },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("환율 자동 맞추기", () => {
  it("USD 구독이 있고 직접 적은 환율이 아니면 고시 환율로 바꾼다", async () => {
    respondWith(1392.5);
    expect(await refreshExchangeRate({ force: true })).toBe(true);
    expect(useStore.getState().exchangeRate).toMatchObject({ rate: 1392.5, source: "ecb" });
  });

  it("직접 적은 환율은 저절로 바꾸지 않는다", async () => {
    useStore.setState({ exchangeRate: { rate: 1450, source: "manual", updatedAt: null } });
    const fetchMock = respondWith(1392.5);
    expect(await refreshExchangeRate()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(useStore.getState().exchangeRate.rate).toBe(1450);
  });

  it("'자동으로 맞추기'를 누르면 직접 적은 환율도 고시 환율로 바꾼다", async () => {
    useStore.setState({ exchangeRate: { rate: 1450, source: "manual", updatedAt: null } });
    respondWith(1392.5);
    expect(await refreshExchangeRate({ force: true })).toBe(true);
    expect(useStore.getState().exchangeRate).toMatchObject({ rate: 1392.5, source: "ecb" });
  });

  it("받지 못하거나 이상한 값이면 쓰던 환율을 그대로 둔다", async () => {
    useStore.setState({ exchangeRate: { rate: 1450, source: "manual", updatedAt: null } });
    respondWith(-1);
    expect(await refreshExchangeRate({ force: true })).toBe(false);
    respondWith(1392.5, false);
    expect(await refreshExchangeRate({ force: true })).toBe(false);
    expect(useStore.getState().exchangeRate).toMatchObject({ rate: 1450, source: "manual" });
  });

  it("USD 구독이 없으면 묻지 않는다", async () => {
    useStore.setState({ subscriptions: [] as never });
    const fetchMock = respondWith(1392.5);
    expect(await refreshExchangeRate()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
