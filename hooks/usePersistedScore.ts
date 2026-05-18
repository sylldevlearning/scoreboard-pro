import { useState, useEffect, useCallback } from "react";
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

  useEffect(() => {
    AsyncStorage.getItem(key).then((raw) => {
      setSavedData(raw ? (JSON.parse(raw) as T) : null);
      setIsLoaded(true);
    });
  }, [key]);

  const save = useCallback(
    (data: T) => {
      AsyncStorage.setItem(key, JSON.stringify(data));
    },
    [key]
  );

  const resume = useCallback((): T | null => {
    const data = savedData;
    setSavedData(null);
    return data;
  }, [savedData]);

  const clear = useCallback(() => {
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
