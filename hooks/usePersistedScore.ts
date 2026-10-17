import { useState, useEffect, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type UsePersistedScore<T> = {
  savedData: T | null;
  hasSavedScore: boolean;
  isLoaded: boolean;
  /** False while a saved game is waiting for the user's "resume?" answer. */
  hasUserDecided: boolean;
  save: (data: T) => void;
  resume: () => T | null;
  clear: () => void;
};

export function usePersistedScore<T>(key: string): UsePersistedScore<T> {
  const [savedData, setSavedData] = useState<T | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasUserDecided, setHasUserDecided] = useState(false);
  // Ref mirror so save() can check it synchronously without changing identity.
  const decidedRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingRef = useRef<T | null>(null);

  const markDecided = useCallback(() => {
    decidedRef.current = true;
    setHasUserDecided(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (cancelled) return;
        let parsed: T | null = null;
        if (raw) {
          try {
            parsed = JSON.parse(raw) as T;
          } catch {
            AsyncStorage.removeItem(key).catch(() => {});
          }
        }
        setSavedData(parsed);
        // Nothing to resume → saving can start right away.
        if (parsed === null) markDecided();
      })
      .catch(() => {
        if (!cancelled) markDecided();
      })
      .finally(() => {
        if (!cancelled) setIsLoaded(true);
      });
    return () => { cancelled = true; };
  }, [key, markDecided]);

  // On unmount, write the pending debounced save instead of dropping it.
  useEffect(() => {
    return () => {
      clearTimeout(saveTimeoutRef.current);
      if (pendingRef.current !== null) {
        AsyncStorage.setItem(key, JSON.stringify(pendingRef.current)).catch(() => {});
        pendingRef.current = null;
      }
    };
  }, [key]);

  const save = useCallback(
    (data: T) => {
      // Don't overwrite a saved game before the user answered the resume prompt.
      if (!decidedRef.current) return;
      pendingRef.current = data;
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        pendingRef.current = null;
        AsyncStorage.setItem(key, JSON.stringify(data)).catch(() => {});
      }, 400);
    },
    [key]
  );

  const resume = useCallback((): T | null => {
    const data = savedData;
    setSavedData(null);
    markDecided();
    return data;
  }, [savedData, markDecided]);

  const clear = useCallback(() => {
    clearTimeout(saveTimeoutRef.current);
    pendingRef.current = null;
    AsyncStorage.removeItem(key).catch(() => {});
    setSavedData(null);
    markDecided();
  }, [key, markDecided]);

  return {
    savedData,
    hasSavedScore: savedData !== null && isLoaded,
    isLoaded,
    hasUserDecided,
    save,
    resume,
    clear,
  };
}
