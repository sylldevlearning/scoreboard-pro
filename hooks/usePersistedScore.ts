import { useState, useEffect, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type UsePersistedScore<T> = {
  savedData: T | null;
  hasSavedScore: boolean;
  isLoaded: boolean;
  save: (data: T) => void;
  resume: () => T | null;
  clear: () => void;
};

export function usePersistedScore<T>(key: string): UsePersistedScore<T> {
  const [savedData, setSavedData] = useState<T | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    AsyncStorage.getItem(key).then((raw) => {
      setSavedData(raw ? (JSON.parse(raw) as T) : null);
      setIsLoaded(true);
    });
  }, [key]);

  useEffect(() => {
    return () => { clearTimeout(saveTimeoutRef.current); };
  }, []);

  const save = useCallback(
    (data: T) => {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        AsyncStorage.setItem(key, JSON.stringify(data));
      }, 400);
    },
    [key]
  );

  const resume = useCallback((): T | null => {
    const data = savedData;
    setSavedData(null);
    return data;
  }, [savedData]);

  const clear = useCallback(() => {
    clearTimeout(saveTimeoutRef.current);
    AsyncStorage.removeItem(key);
    setSavedData(null);
  }, [key]);

  return {
    savedData,
    hasSavedScore: savedData !== null && isLoaded,
    isLoaded,
    save,
    resume,
    clear,
  };
}
