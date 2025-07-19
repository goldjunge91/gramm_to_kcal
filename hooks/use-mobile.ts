import * as React from "react";

const MOBILE_BREAKPOINT = 768;

const detectMobileDevice = (): boolean => {
  // Check screen width first
  const isSmallScreen = window.innerWidth < MOBILE_BREAKPOINT;

  // Check for mobile devices using user agent
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileDevice =
    /iphone|ipad|ipod|android|blackberry|windows phone|opera mini/i.test(
      userAgent,
    );

  // iOS Safari detection
  const isIOS = /iphone|ipad|ipod/i.test(userAgent);

  // Return true if either small screen OR mobile device detected
  return isSmallScreen || isMobileDevice || isIOS;
};

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(detectMobileDevice());
    };
    mql.addEventListener("change", onChange);
    setIsMobile(detectMobileDevice());
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
