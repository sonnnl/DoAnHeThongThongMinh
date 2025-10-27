/**
 * FILE: web/frontend/src/hooks/useDebounce.js
 * MỤC ĐÍCH: Custom hook for debouncing values
 */

import { useState, useEffect } from "react";

export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
