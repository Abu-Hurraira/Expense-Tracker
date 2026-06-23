interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
  subtitle?: string;
}

export default function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}20`, color }}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div className="stat-info">
        <span className="stat-title">{title}</span>
        <span className="stat-value">{value}</span>
        {subtitle && <span className="stat-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}
