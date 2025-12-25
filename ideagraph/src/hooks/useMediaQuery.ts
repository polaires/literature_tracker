import { useState, useEffect, useCallback } from 'react';

// Tailwind CSS default breakpoints
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Hook to detect if a media query matches
 * @param query - CSS media query string
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
    // Legacy browsers
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, [query]);

  return matches;
}

/**
 * Hook to check if screen is smaller than a breakpoint
 * @param breakpoint - Tailwind breakpoint name
 * @returns true if screen is smaller than the breakpoint
 */
export function useIsMobile(breakpoint: Breakpoint = 'md'): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS[breakpoint] - 1}px)`);
}

/**
 * Hook to check if screen is larger than or equal to a breakpoint
 * @param breakpoint - Tailwind breakpoint name
 * @returns true if screen is at or above the breakpoint
 */
export function useIsDesktop(breakpoint: Breakpoint = 'lg'): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS[breakpoint]}px)`);
}

/**
 * Hook to detect touch device
 * @returns true if device supports touch
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-expect-error - msMaxTouchPoints is IE-specific
        navigator.msMaxTouchPoints > 0
      );
    };

    checkTouch();
  }, []);

  return isTouch;
}

/**
 * Comprehensive hook for responsive design
 * Returns current breakpoint and various helper flags
 */
export function useResponsive() {
  const isMobile = useIsMobile('md');
  const isTablet = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`);
  const isDesktop = useIsDesktop('lg');
  const isLargeDesktop = useIsDesktop('xl');
  const isTouch = useIsTouchDevice();
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const isPortrait = useMediaQuery('(orientation: portrait)');

  // Get current breakpoint name
  const getCurrentBreakpoint = useCallback((): Breakpoint | 'xs' => {
    if (typeof window === 'undefined') return 'xs';
    const width = window.innerWidth;
    if (width >= BREAKPOINTS['2xl']) return '2xl';
    if (width >= BREAKPOINTS.xl) return 'xl';
    if (width >= BREAKPOINTS.lg) return 'lg';
    if (width >= BREAKPOINTS.md) return 'md';
    if (width >= BREAKPOINTS.sm) return 'sm';
    return 'xs';
  }, []);

  const [breakpoint, setBreakpoint] = useState<Breakpoint | 'xs'>(() => getCurrentBreakpoint());

  useEffect(() => {
    const handleResize = () => {
      setBreakpoint(getCurrentBreakpoint());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getCurrentBreakpoint]);

  return {
    // Flags
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isTouch,
    prefersReducedMotion,
    isLandscape,
    isPortrait,

    // Current breakpoint
    breakpoint,

    // Helpers for conditional rendering
    showMobileNav: isMobile,
    showDesktopSidebar: isDesktop,
    useMobileDrawer: isMobile || isTablet,
  };
}
