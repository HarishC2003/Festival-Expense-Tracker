import React from 'react';

export interface KPICardProps {
  title: string;
  value: string | number | null | undefined;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down';
  trendValue?: string;
  accentColor?: string;
  isLoading?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title, value, subtitle, icon,
  trend, trendValue, accentColor = '#6366F1',
  isLoading = false
}) => {
  if (isLoading) return (
    <div className="kpi-card">
      <div className="skeleton h-4 w-24 mb-3" />
      <div className="skeleton h-8 w-16 mb-2" />
      <div className="skeleton h-3 w-20" />
    </div>
  )
  return (
    <div className="kpi-card" style={{ borderLeft: `3px solid ${accentColor}` }}>
      <div className="flex items-center justify-between">
        <span className="kpi-card-label">{title}</span>
        {icon && (
          <span className="text-xl opacity-60">{icon}</span>
        )}
      </div>
      <div className="kpi-card-value">{value ?? '—'}</div>
      <div className="flex items-center gap-2">
        {subtitle && (
          <span className="text-xs text-[#64748B]">{subtitle}</span>
        )}
        {trend && trendValue && (
          <span className={trend === 'up'
            ? 'kpi-card-trend-up' : 'kpi-card-trend-down'}>
            {trend === 'up' ? '▲' : '▼'} {trendValue}
          </span>
        )}
      </div>
    </div>
  )
}
