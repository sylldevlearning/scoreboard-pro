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

  it("save() calls AsyncStorage.setItem with JSON-serialised data", () => {
    const { result } = renderHook(() => usePersistedScore<ScoreData>(MOCK_KEY));
    const data: ScoreData = { scoreA: 2, scoreB: 0 };
    act(() => { result.current.save(data); });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(MOCK_KEY, JSON.stringify(data));
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
});
