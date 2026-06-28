import useInstallPrompt from "../../hooks/useInstallPrompt";

export default function InstallBanner() {
  const { canInstall, showIOS, promptInstall, dismiss } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <div className="install-banner" role="status">
      <img src="/icons/icon.svg" alt="" className="install-banner-icon" />
      <div className="install-banner-text">
        {showIOS ? (
          <>
            <strong>Instalá la app</strong>
            <span>Tocá <em>Compartir</em> y después <em>Agregar a pantalla de inicio</em>.</span>
          </>
        ) : (
          <>
            <strong>Instalá la app</strong>
            <span>Abrila directamente desde tu escritorio o pantalla de inicio.</span>
          </>
        )}
      </div>
      <div className="install-banner-actions">
        {!showIOS && (
          <button type="button" className="install-banner-btn" onClick={promptInstall}>
            Instalar
          </button>
        )}
        <button type="button" className="install-banner-dismiss" onClick={dismiss} aria-label="Cerrar">
          ✕
        </button>
      </div>
    </div>
  );
}
