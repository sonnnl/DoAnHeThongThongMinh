/**
 * FILE: web/frontend/src/hooks/__tests__/useDebounce.test.js
 * MỤC ĐÍCH: Unit tests cho custom hook useDebounce
 */

import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "../useDebounce";

describe("useDebounce Hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 500));
    expect(result.current).toBe("initial");
  });

  it("should update the value after the specified delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 500 },
      }
    );

    expect(result.current).toBe("initial");

    // Rerender with a new value
    rerender({ value: "updated", delay: 500 });

    // Value should still be initial because delay hasn't passed
    expect(result.current).toBe("initial");

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Value should now be updated
    expect(result.current).toBe("updated");
  });

  it("should clear timeout and restart timer if value changes before delay finishes", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 500 },
      }
    );

    // Change value
    rerender({ value: "first-change", delay: 500 });
    
    // Advance half way (250ms)
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe("initial");

    // Change value again before first delay finishes
    rerender({ value: "second-change", delay: 500 });

    // Advance another 300ms (total elapsed 550ms since first change, but only 300ms since second change)
    act(() => {
      vi.advanceTimersByTime(300);
    });
    // Should still be "initial" since second-change has only had 300ms elapsed
    expect(result.current).toBe("initial");

    // Advance remaining 200ms for second-change (total 500ms since second change)
    act(() => {
      vi.advanceTimersByTime(200);
    });
    // Should now update to the latest value
    expect(result.current).toBe("second-change");
  });
});
