import { renderHook, act } from "@testing-library/react-native";
import { useGameTimer } from "@/hooks/useGameTimer";

describe("useGameTimer", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("initial state: timeLeft=0, isRunning=false", () => {
    const { result } = renderHook(() => useGameTimer());
    expect(result.current.timeLeft).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  it("start() sets timeLeft to durationMinutes*60 and isRunning=true", () => {
    const { result } = renderHook(() => useGameTimer());
    act(() => { result.current.start(20); });
    expect(result.current.timeLeft).toBe(1200);
    expect(result.current.isRunning).toBe(true);
  });

  it("start() is ignored when already running", () => {
    const { result } = renderHook(() => useGameTimer());
    act(() => { result.current.start(10); });
    act(() => { result.current.start(45); }); // should be ignored
    expect(result.current.timeLeft).toBe(600);
  });

  it("timer decrements each second", () => {
    const { result } = renderHook(() => useGameTimer());
    act(() => { result.current.start(1); }); // 60 seconds
    act(() => { jest.advanceTimersByTime(5000); });
    expect(result.current.timeLeft).toBe(55);
  });

  it("stop() pauses the timer", () => {
    const { result } = renderHook(() => useGameTimer());
    act(() => { result.current.start(1); });
    act(() => { jest.advanceTimersByTime(10000); });
    act(() => { result.current.stop(); });
    const frozenTime = result.current.timeLeft;
    act(() => { jest.advanceTimersByTime(10000); });
    expect(result.current.timeLeft).toBe(frozenTime);
    expect(result.current.isRunning).toBe(false);
  });

  it("resume() continues from frozen timeLeft", () => {
    const { result } = renderHook(() => useGameTimer());
    act(() => { result.current.start(1); }); // 60s
    act(() => { jest.advanceTimersByTime(10000); }); // 50s left
    act(() => { result.current.stop(); });
    act(() => { result.current.resume(); });
    expect(result.current.isRunning).toBe(true);
    act(() => { jest.advanceTimersByTime(5000); });
    expect(result.current.timeLeft).toBe(45);
  });

  it("resume() is ignored when already running", () => {
    const { result } = renderHook(() => useGameTimer());
    act(() => { result.current.start(1); });
    act(() => { result.current.resume(); }); // no-op
    expect(result.current.isRunning).toBe(true);
    expect(result.current.timeLeft).toBe(60);
  });

  it("resume() is ignored when timeLeft=0", () => {
    const { result } = renderHook(() => useGameTimer());
    // timeLeft=0 by default, isRunning=false
    act(() => { result.current.resume(); });
    expect(result.current.isRunning).toBe(false);
  });

  it("reset() stops timer and sets timeLeft=0", () => {
    const { result } = renderHook(() => useGameTimer());
    act(() => { result.current.start(5); });
    act(() => { result.current.reset(); });
    expect(result.current.isRunning).toBe(false);
    expect(result.current.timeLeft).toBe(0);
  });

  it("calls onEnd callback when timer reaches 0", () => {
    const onEnd = jest.fn();
    const { result } = renderHook(() => useGameTimer(onEnd));
    act(() => { result.current.start(1); }); // 60s
    act(() => { jest.advanceTimersByTime(61000); });
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.timeLeft).toBe(0);
  });

  it("onEnd not called if timer is stopped before reaching 0", () => {
    const onEnd = jest.fn();
    const { result } = renderHook(() => useGameTimer(onEnd));
    act(() => { result.current.start(1); });
    act(() => { jest.advanceTimersByTime(30000); });
    act(() => { result.current.stop(); });
    act(() => { jest.advanceTimersByTime(60000); });
    expect(onEnd).not.toHaveBeenCalled();
  });

  it("interval is cleared on unmount (no leak)", () => {
    const clearSpy = jest.spyOn(global, "clearInterval");
    const { result, unmount } = renderHook(() => useGameTimer());
    act(() => { result.current.start(5); });
    unmount();
    // clearInterval called by stop() inside reset or cleanup
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
