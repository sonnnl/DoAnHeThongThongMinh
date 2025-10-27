/**
 * FILE: web/frontend/src/hooks/useIntersectionObserver.js
 * MỤC ĐÍCH: Custom hook for intersection observer (infinite scroll)
 */

import { useEffect, useRef, useState } from "react";

export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(target);

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [options]);

  return [targetRef, isIntersecting];
};
