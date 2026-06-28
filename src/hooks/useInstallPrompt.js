import { useEffect, useState } from "react";

const DISMISS_KEY = "prode2026.installDismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isAndroid() {
  return /android/i.test(window.navigator.userAgent);
}

export default function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isStandalone() || dismissed) return;

    function handler(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    }

    window.addEventListener("beforeinstallprompt", handler);

    if (isIOS() || isAndroid()) {
      const ios = isIOS() && !isStandalone();
      setShowIOS(ios);
      if (ios) setCanInstall(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissed]);

  async function promptInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setCanInstall(false);
      setDismissed(true);
    }
    setDeferredPrompt(null);
  }

  function dismiss() {
    setDismissed(true);
    setCanInstall(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  }

  return { canInstall, showIOS, promptInstall, dismiss };
}
