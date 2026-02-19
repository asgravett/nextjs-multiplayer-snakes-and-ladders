'use client';

import { useState, useEffect, useRef, RefObject } from 'react';

interface CanvasDimensions {
  width: number;
  height: number;
  scale: number;
}

interface UseResponsiveCanvasOptions {
  baseSize?: number;
  minSize?: number;
  maxSize?: number;
  padding?: number;
  maintainAspectRatio?: boolean;
  reserveBottomSpace?: number;
  reserveBottomSpaceMobile?: number;
  mobileBreakpoint?: number;
}

const DEFAULT_OPTIONS = {
  baseSize: 600,
  minSize: 280,
  maxSize: 700,
  padding: 32,
  maintainAspectRatio: true,
  reserveBottomSpace: 250,
  reserveBottomSpaceMobile: undefined as number | undefined,
  mobileBreakpoint: 1024,
};

export function useResponsiveCanvas(
  containerRef: RefObject<HTMLElement | null>,
  options: UseResponsiveCanvasOptions = {},
): CanvasDimensions {
  const {
    baseSize = DEFAULT_OPTIONS.baseSize,
    minSize = DEFAULT_OPTIONS.minSize,
    maxSize = DEFAULT_OPTIONS.maxSize,
    padding = DEFAULT_OPTIONS.padding,
    maintainAspectRatio = DEFAULT_OPTIONS.maintainAspectRatio,
    reserveBottomSpace = DEFAULT_OPTIONS.reserveBottomSpace,
    reserveBottomSpaceMobile = DEFAULT_OPTIONS.reserveBottomSpaceMobile,
    mobileBreakpoint = DEFAULT_OPTIONS.mobileBreakpoint,
  } = options;

  const [dimensions, setDimensions] = useState<CanvasDimensions>({
    width: baseSize,
    height: baseSize,
    scale: 1,
  });

  // Track if initial calculation has been done
  const initializedRef = useRef(false);
  const lastWindowWidthRef = useRef<number>(0);
  const lastWindowHeightRef = useRef<number>(0);

  useEffect(() => {
    const calculateDimensions = () => {
      // Only recalculate if window size actually changed (not container size)
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Skip if window size hasn't changed (prevents loop from container resize)
      if (
        initializedRef.current &&
        lastWindowWidthRef.current === windowWidth &&
        lastWindowHeightRef.current === windowHeight
      ) {
        return;
      }

      lastWindowWidthRef.current = windowWidth;
      lastWindowHeightRef.current = windowHeight;
      initializedRef.current = true;

      // Pick the correct reserve based on orientation
      // In landscape, controls sit beside the board; in portrait, they stack below
      const isLandscape = windowWidth > windowHeight;
      const effectiveReserve =
        reserveBottomSpaceMobile !== undefined && !isLandscape
          ? reserveBottomSpaceMobile
          : reserveBottomSpace;

      let availableWidth: number;
      let availableHeight: number;

      const container = containerRef.current;

      if (container) {
        availableWidth = windowWidth - padding * 2;
        const topOffset = container.getBoundingClientRect().top;
        availableHeight = windowHeight - topOffset - effectiveReserve - padding;
      } else {
        availableWidth = windowWidth - padding * 2;
        availableHeight = windowHeight - effectiveReserve - padding * 2;
      }

      // Ensure we don't go negative
      availableHeight = Math.max(minSize, availableHeight);

      // Calculate optimal size
      let size: number;

      if (maintainAspectRatio) {
        // Use smaller dimension for square aspect ratio
        size = Math.min(availableWidth, availableHeight);
      } else {
        size = availableWidth;
      }

      // Clamp between min and max
      size = Math.max(minSize, Math.min(maxSize, size));

      // Calculate scale relative to base size
      const scale = size / baseSize;

      setDimensions({
        width: size,
        height: maintainAspectRatio ? size : availableHeight,
        scale,
      });
    };

    // Calculate on mount
    calculateDimensions();

    // Debounced resize handler
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(calculateDimensions, 100);
    };

    // Only listen to window resize and orientation change
    // Don't use ResizeObserver on the container to avoid feedback loop
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [
    baseSize,
    minSize,
    maxSize,
    padding,
    maintainAspectRatio,
    reserveBottomSpace,
    reserveBottomSpaceMobile,
    mobileBreakpoint,
    containerRef,
  ]);

  return dimensions;
}

export type { CanvasDimensions, UseResponsiveCanvasOptions };
