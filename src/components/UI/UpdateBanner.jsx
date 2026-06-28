import { useEffect, useState } from "react";

const DISMISS_KEY = "prode2026.updateDismissed";

export default function UpdateBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function handler() {
      try {
        if (localStorage.getItem(DISMISS_KEY) === "1") return;
      } catch {}
      setShow(true);
    }

    window.addEventListener("app-update-available", handler);
    return () => window.removeEventListener("app-update-available", handler);
  }, []);

  function reload() {
    window.location.reload();
  }

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  }

  if (!show) return null;

  return (
    <div className="update-banner" role="status">
      <div className="update-banner-text">
        <strong>Nueva versión disponible</strong>
        <span>Recargá para actualizar.</span>
      </div>
      <div className="update-banner-actions">
        <button type="button" className="update-banner-btn" onClick={reload}>
          Recargar
        </button>
        <button type="button" className="update-banner-dismiss" onClick={dismiss} aria-label="Cerrar">
          ✕
        </button>
      </div>
    </div>
  );
}
