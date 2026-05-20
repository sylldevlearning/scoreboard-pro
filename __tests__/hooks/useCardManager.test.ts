import { renderHook, act } from "@testing-library/react-native";
import { useCardManager } from "@/hooks/useCardManager";

describe("useCardManager", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  // ──────────────────────────────────────────────
  // addCard / getCardCount
  // ──────────────────────────────────────────────
  it("addCard adds a card to the correct team", () => {
    const { result } = renderHook(() => useCardManager());
    act(() => { result.current.addCard("A", "yellow"); });
    expect(result.current.cards).toHaveLength(1);
    expect(result.current.cards[0]).toMatchObject({ team: "A", cardType: "yellow", expired: false });
  });

  it("getCardCount returns correct count per team and type", () => {
    const { result } = renderHook(() => useCardManager());
    act(() => {
      result.current.addCard("A", "yellow");
      result.current.addCard("A", "yellow");
      result.current.addCard("B", "red");
    });
    expect(result.current.getCardCount("A", "yellow")).toBe(2);
    expect(result.current.getCardCount("B", "red")).toBe(1);
    expect(result.current.getCardCount("A", "red")).toBe(0);
  });

  it("addCard stores penaltySeconds and sets remainingSeconds", () => {
    const { result } = renderHook(() => useCardManager());
    act(() => { result.current.addCard("A", "yellow", 600); });
    const card = result.current.cards[0];
    expect(card.penaltySeconds).toBe(600);
    expect(card.remainingSeconds).toBe(600);
    expect(card.expired).toBe(false);
  });

  // ──────────────────────────────────────────────
  // removeCard / resetCards
  // ──────────────────────────────────────────────
  it("removeCard removes only the targeted card", () => {
    const { result } = renderHook(() => useCardManager());
    act(() => {
      result.current.addCard("A", "yellow");
      result.current.addCard("B", "red");
    });
    const idToRemove = result.current.cards[0].id;
    act(() => { result.current.removeCard(idToRemove); });
    expect(result.current.cards).toHaveLength(1);
    expect(result.current.cards[0].team).toBe("B");
  });

  it("resetCards clears all cards", () => {
    const { result } = renderHook(() => useCardManager());
    act(() => {
      result.current.addCard("A", "yellow");
      result.current.addCard("B", "red");
    });
    act(() => { result.current.resetCards(); });
    expect(result.current.cards).toHaveLength(0);
  });

  // ──────────────────────────────────────────────
  // Penalty timers — countdown
  // ──────────────────────────────────────────────
  it("remainingSeconds decrements each second when isMatchRunning=true", () => {
    const { result } = renderHook(() => useCardManager(true));
    act(() => { result.current.addCard("A", "yellow", 10); });
    act(() => { jest.advanceTimersByTime(3000); });
    const card = result.current.cards[0];
    expect(card.remainingSeconds).toBe(7);
    expect(card.expired).toBe(false);
  });

  it("timer does NOT decrement when isMatchRunning=false", () => {
    const { result } = renderHook(() => useCardManager(false));
    act(() => { result.current.addCard("A", "yellow", 10); });
    act(() => { jest.advanceTimersByTime(5000); });
    expect(result.current.cards[0].remainingSeconds).toBe(10);
  });

  it("card expires (expired=true, remainingSeconds=0) when timer reaches 0", () => {
    const { result } = renderHook(() => useCardManager(true));
    act(() => { result.current.addCard("A", "yellow", 3); });
    act(() => { jest.advanceTimersByTime(4000); });
    const card = result.current.cards[0];
    expect(card.expired).toBe(true);
    expect(card.remainingSeconds).toBe(0);
  });

  it("timer pauses mid-countdown when isMatchRunning flips to false", () => {
    let isRunning = true;
    const { result, rerender } = renderHook(
      ({ running }) => useCardManager(running),
      { initialProps: { running: true } }
    );
    act(() => { result.current.addCard("A", "yellow", 10); });
    act(() => { jest.advanceTimersByTime(3000); });
    expect(result.current.cards[0].remainingSeconds).toBe(7);

    rerender({ running: false });
    act(() => { jest.advanceTimersByTime(3000); });
    expect(result.current.cards[0].remainingSeconds).toBe(7); // frozen
  });

  // ──────────────────────────────────────────────
  // getActivePenalties
  // ──────────────────────────────────────────────
  it("getActivePenalties returns only non-expired timed cards for team", () => {
    const { result } = renderHook(() => useCardManager(true));
    act(() => {
      result.current.addCard("A", "yellow", 5);
      result.current.addCard("A", "red"); // no timer — not a penalty
      result.current.addCard("B", "yellow", 5);
    });
    expect(result.current.getActivePenalties("A")).toHaveLength(1);
    expect(result.current.getActivePenalties("B")).toHaveLength(1);
  });

  it("getActivePenalties excludes expired cards", () => {
    const { result } = renderHook(() => useCardManager(true));
    act(() => { result.current.addCard("A", "yellow", 2); });
    act(() => { jest.advanceTimersByTime(3000); }); // expires
    expect(result.current.getActivePenalties("A")).toHaveLength(0);
  });

  // ──────────────────────────────────────────────
  // getPlayersOnField (rugby use-case)
  // ──────────────────────────────────────────────
  it("getPlayersOnField = maxPlayers - inPrison - expelled", () => {
    const { result } = renderHook(() => useCardManager());
    act(() => {
      result.current.addCard("A", "yellow", 600); // in prison
      result.current.addCard("A", "red");          // expelled
    });
    expect(result.current.getPlayersOnField("A", 15)).toBe(13);
  });

  it("getPlayersOnField never goes below 0", () => {
    const { result } = renderHook(() => useCardManager());
    act(() => {
      for (let i = 0; i < 20; i++) result.current.addCard("A", "yellow", 600);
    });
    expect(result.current.getPlayersOnField("A", 15)).toBe(0);
  });

  it("expired prison cards no longer subtract from player count", () => {
    const { result } = renderHook(() => useCardManager(true));
    act(() => { result.current.addCard("A", "yellow", 1); });
    act(() => { jest.advanceTimersByTime(2000); }); // expires
    expect(result.current.getPlayersOnField("A", 15)).toBe(15);
  });

  // ──────────────────────────────────────────────
  // Football: 2e jaune → rouge automatique
  // (tested at hook level — caller is responsible for triggering this)
  // ──────────────────────────────────────────────
  it("getCardCount reflects 2nd yellow correctly so caller can trigger red", () => {
    const { result } = renderHook(() => useCardManager());
    act(() => { result.current.addCard("A", "yellow"); });
    expect(result.current.getCardCount("A", "yellow")).toBe(1);
    // Caller reads count BEFORE adding the 2nd yellow → triggers red
    const countBefore = result.current.getCardCount("A", "yellow");
    act(() => {
      result.current.addCard("A", "yellow");
      if (countBefore >= 1) result.current.addCard("A", "red");
    });
    expect(result.current.getCardCount("A", "yellow")).toBe(2);
    expect(result.current.getCardCount("A", "red")).toBe(1);
  });
});
