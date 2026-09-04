import { useEffect, useState } from 'react';

export type Breakpoint = 'narrow' | 'normal' | 'wide';

const NARROW_MAX = 1024;
const NORMAL_MAX = 1440;

function classify(width: number): Breakpoint {
  if (width < NARROW_MAX) return 'narrow';
  if (width < NORMAL_MAX) return 'normal';
  return 'wide';
}

/**
 * The desktop app's inline-`style={{}}` convention (the overwhelming majority of its styling,
 * see index.css's near-total absence of component-specific classes) can't respond to CSS
 * `@media` queries - those only reach real stylesheet rules. This hook is the equivalent for
 * layout decisions inline styles DO need to branch on (e.g. Sidebar's icon-only collapse, which
 * swaps visible content rather than just resizing) - `flexWrap: 'wrap'` and
 * `repeat(auto-fit, minmax(...))` cover the cases pure CSS handles on its own and don't need
 * this.
 *
 * Breakpoints target desktop window-resize zones (a narrow split-screen laptop window vs. a
 * default window vs. a large/ultrawide monitor), not phone screen sizes - apps/mobile has its
 * own, unrelated responsive story for actual device sizes.
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() =>
    classify(typeof window !== 'undefined' ? window.innerWidth : NORMAL_MAX),
  );

  useEffect(() => {
    const onResize = (): void => setBreakpoint(classify(window.innerWidth));
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return breakpoint;
}
