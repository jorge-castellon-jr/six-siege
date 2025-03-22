// src/hooks/useTacticalEffects.tsx
import { useState, useEffect, useRef } from "react";

/**
 * Hook to create a typing animation effect for text
 * @param text Text to animate
 * @param speed Speed of typing in ms
 * @param delay Initial delay before typing starts
 * @returns Current text state during animation
 */
export const useTypewriter = (
  text: string,
  speed: number = 30,
  delay: number = 500,
) => {
  const [displayText, setDisplayText] = useState("");
  const index = useRef(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    // Create a function that will handle the typing animation
    const typeNextCharacter = () => {
      if (index.current < text.length) {
        setDisplayText(text.substring(0, index.current + 1));
        index.current += 1;

        setTimeout(typeNextCharacter, speed);
      }
    };

    // Handle initial delay
    let timer: ReturnType<typeof setTimeout>;

    if (!started) {
      timer = setTimeout(() => {
        setStarted(true);
        // Start typing after delay
        typeNextCharacter();
      }, delay);

      return () => clearTimeout(timer);
    }

    return () => { };
  }, [text, speed, delay, started]);

  // Reset when text changes
  useEffect(() => {
    setDisplayText("");
    index.current = 0;
    setStarted(false);
  }, [text]);

  return displayText;
};

/**
 * Hook to create a value counting animation
 * @param endValue Final value to count to
 * @param duration Duration of the animation in ms
 * @param startValue Starting value (default: 0)
 * @returns Current value during animation
 */
export const useCounter = (
  endValue: number,
  duration: number = 1000,
  startValue: number = 0,
) => {
  const [count, setCount] = useState(startValue);
  const frameRef = useRef(0);
  const startTimeRef = useRef(0);

  useEffect(() => {
    // Reset when end value changes
    setCount(startValue);
    startTimeRef.current = 0;

    // Animation function
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Calculate the current value based on progress
      const currentValue = startValue + (endValue - startValue) * progress;
      setCount(Math.floor(currentValue));

      // Continue animation if not complete
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    // Start animation
    frameRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => cancelAnimationFrame(frameRef.current);
  }, [endValue, duration, startValue]);

  return count;
};

/**
 * Hook to create a tactical pulsing effect
 * @param interval Interval between pulses in ms
 * @returns Boolean indicating whether element should be highlighted
 */
export const useTacticalPulse = (interval: number = 2000) => {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    // Toggle pulse state at regular intervals
    const timer = setInterval(() => {
      setPulse((prev) => !prev);
    }, interval);

    return () => clearInterval(timer);
  }, [interval]);

  return pulse;
};

/**
 * Hook to create a tactical scanning line effect
 * @returns Value between 0-100 representing scan line position
 */
export const useScanLine = () => {
  const [position, setPosition] = useState(0);

  useEffect(() => {
    // Animate scan line from top to bottom repeatedly
    const animate = () => {
      setPosition((prev) => {
        if (prev >= 100) {
          return 0;
        }
        return prev + 0.5;
      });
    };

    const interval = setInterval(animate, 20);
    return () => clearInterval(interval);
  }, []);

  return position;
};

/**
 * Hook to create tactical data refresh effect
 * @param refreshInterval Interval in ms between refreshes
 * @returns Object with isRefreshing state and trigger function
 */
export const useDataRefresh = (refreshInterval: number = 5000) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Function to trigger a manual refresh
  const triggerRefresh = () => {
    if (!isRefreshing) {
      setIsRefreshing(true);

      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000); // Animation lasts 1 second
    }
  };

  // Auto refresh on interval
  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      triggerRefresh();
    }, refreshInterval);

    return () => clearInterval(timer);
  }, [refreshInterval, autoRefresh]);

  return {
    isRefreshing,
    triggerRefresh,
    autoRefresh,
    setAutoRefresh,
  };
};
