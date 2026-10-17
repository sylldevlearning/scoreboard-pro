import AsyncStorage from "@react-native-async-storage/async-storage";
import { renderHook, act, waitFor } from "@testing-library/react-native";
import { usePersistedScore } from "@/hooks/usePersistedScore";

const MOCK_KEY = "test-sport";

type ScoreData = { scoreA: number; scoreB: number };

describe("usePersistedScore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it("isLoaded=false initially, then true after AsyncStorage resolves", async () => {
    const { result } = renderHook(() => usePersistedScore<ScoreData>(MOCK_KEY));
    expect(result.current.isLoaded).toBe(false);
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
  });

  it("hasSavedScore=false when no stored data", async () => {
    const { result } = renderHook(() => usePersistedScore<ScoreData>(MOCK_KEY));
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.hasSavedScore).toBe(false);
  });

  it("loads and exposes saved data from AsyncStorage", async () => {
    const saved: ScoreData = { scoreA: 3, scoreB: 1 };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(saved));
    const { result } = renderHook(() => usePersistedScore<ScoreData>(MOCK_KEY));
    await waitFor(() => expect(result.current.hasSavedScore).toBe(true));
    expect(result.current.savedData).toEqual(saved);
  });

  it("save() calls AsyncStorage.setItem with JSON-serialised data (debounced 400ms)", async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => usePersistedScore<ScoreData>(MOCK_KEY));
    await act(async () => {});
    const data: ScoreData = { scoreA: 2, scoreB: 0 };
    act(() => { result.current.save(data); });
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    act(() => { jest.advanceTimersByTime(400); });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(MOCK_KEY, JSON.stringify(data));
    jest.useRealTimers();
  });

  it("save() debounces: rapid calls result in a single AsyncStorage write", async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => usePersistedScore<ScoreData>(MOCK_KEY));
    await act(async () => {});
    act(() => {
      result.current.save({ scoreA: 1, scoreB: 0 });
      result.current.save({ scoreA: 2, scoreB: 0 });
      result.current.save({ scoreA: 3, scoreB: 0 });
    });
    act(() => { jest.advanceTimersByTime(400); });
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(MOCK_KEY, JSON.stringify({ scoreA: 3, scoreB: 0 }));
    jest.useRealTimers();
  });

  it("resume() returns saved data and clears hasSavedScore", async () => {
    const saved: ScoreData = { scoreA: 5, scoreB: 3 };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(saved));
    const { result } = renderHook(() => usePersistedScore<ScoreData>(MOCK_KEY));
    await waitFor(() => expect(result.current.hasSavedScore).toBe(true));

    let returned: ScoreData | null = null;
    act(() => { returned = result.current.resume(); });
    expect(returned).toEqual(saved);
    expect(result.current.hasSavedScore).toBe(false);
    expect(result.current.savedData).toBeNull();
  });

  it("clear() calls AsyncStorage.removeItem and sets savedData to null", async () => {
    const saved: ScoreData = { scoreA: 1, scoreB: 2 };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(saved));
    const { result } = renderHook(() => usePersistedScore<ScoreData>(MOCK_KEY));
    await waitFor(() => expect(result.current.hasSavedScore).toBe(true));

    act(() => { result.current.clear(); });
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(MOCK_KEY);
    expect(result.current.savedData).toBeNull();
  });

  it("corrupted JSON: removes the key, exposes no saved data and still loads", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("{not json");
    const { result } = renderHook(() => usePersistedScore<ScoreData>(MOCK_KEY));
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.savedData).toBeNull();
    expect(result.current.hasSavedScore).toBe(false);
    expect(result.current.hasUserDecided).toBe(true);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(MOCK_KEY);
  });

  it("getItem rejecting: still loads with no saved data", async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error("disk"));
    const { result } = renderHook(() => usePersistedScore<ScoreData>(MOCK_KEY));
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.hasSavedScore).toBe(false);
  });

  it("does not overwrite a saved game before the user answers the resume prompt", async () => {
    jest.useFakeTimers();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({ scoreA: 5, scoreB: 3 }));
    const { result } = renderHook(() => usePersistedScore<ScoreData>(MOCK_KEY));
    await act(async () => {});
    expect(result.current.hasUserDecided).toBe(false);
    act(() => { result.current.save({ scoreA: 0, scoreB: 0 }); });
    act(() => { jest.advanceTimersByTime(400); });
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();

    act(() => { result.current.resume(); });
    expect(result.current.hasUserDecided).toBe(true);
    act(() => { result.current.save({ scoreA: 6, scoreB: 3 }); });
    act(() => { jest.advanceTimersByTime(400); });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(MOCK_KEY, JSON.stringify({ scoreA: 6, scoreB: 3 }));
    jest.useRealTimers();
  });

  it("saving starts after the user discards the saved game", async () => {
    jest.useFakeTimers();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({ scoreA: 5, scoreB: 3 }));
    const { result } = renderHook(() => usePersistedScore<ScoreData>(MOCK_KEY));
    await act(async () => {});
    act(() => { result.current.clear(); });
    act(() => { result.current.save({ scoreA: 1, scoreB: 0 }); });
    act(() => { jest.advanceTimersByTime(400); });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(MOCK_KEY, JSON.stringify({ scoreA: 1, scoreB: 0 }));
    jest.useRealTimers();
  });

  it("flushes a pending debounced save on unmount", async () => {
    jest.useFakeTimers();
    const { result, unmount } = renderHook(() => usePersistedScore<ScoreData>(MOCK_KEY));
    await act(async () => {});
    act(() => { result.current.save({ scoreA: 4, scoreB: 2 }); });
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    unmount();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(MOCK_KEY, JSON.stringify({ scoreA: 4, scoreB: 2 }));
    jest.useRealTimers();
  });
});
