import { useState, useRef, useCallback, useEffect } from "react";

type UseGameTimer = {
  timeLeft: number;
  isRunning: boolean;
  start: (durationMinutes: number) => void;
  stop: () => void;
  resume: () => void;
  reset: () => void;
};

export function useGameTimer(onEnd?: () => void): UseGameTimer {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Keep onEnd stable without requiring the caller to memoize it
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onEndRef.current = onEnd;
  });

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const start = useCallback(
    (durationMinutes: number) => {
      if (isRunning) return;
      setTimeLeft(durationMinutes * 60);
      setIsRunning(true);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            setIsRunning(false);
            onEndRef.current?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [isRunning]
  );

  const resume = useCallback(() => {
    if (isRunning || timeLeft === 0) return;
    setIsRunning(true);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setIsRunning(false);
          onEndRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isRunning, timeLeft]);

  const reset = useCallback(() => {
    stop();
    setTimeLeft(0);
  }, [stop]);

  return { timeLeft, isRunning, start, stop, resume, reset };
}
