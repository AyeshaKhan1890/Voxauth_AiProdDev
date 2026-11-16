type LogoProps = {
  compact?: boolean;
  inverted?: boolean;
};

export function VoxauthLogo({ compact = false, inverted = false }: LogoProps) {
  return (
    <span className={`logo-lockup ${compact ? "logo-compact" : ""}`}>
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
      {!compact && (
        <span className={`logo-word ${inverted ? "logo-word-inverted" : ""}`}>
          Voxauth
        </span>
      )}
      <span className="sr-only">Voxauth</span>
    </span>
  );
}
