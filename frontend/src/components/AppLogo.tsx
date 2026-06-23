type AppLogoProps = {
  size?: number;
  className?: string;
};

export default function AppLogo({ size = 40, className = '' }: AppLogoProps) {
  return (
    <img
      src="/logo.png"
      alt=""
      width={size}
      height={size}
      className={`app-logo ${className}`.trim()}
      draggable={false}
    />
  );
}
