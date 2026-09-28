import React from 'react';
import { 
  Package, 
  Boxes, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus 
} from 'lucide-react';

const ICON_MAP = {
  Package,
  Boxes,
  AlertTriangle,
  Clock,
};

/**
 * Reusable StatCard component for enterprise dashboard key metrics.
 */
export default function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  subtext,
  icon,
  className = '',
}) {
  const IconComponent = typeof icon === 'string' ? (ICON_MAP[icon] || Package) : icon;

  const renderTrendIcon = () => {
    if (changeType === 'positive') return <TrendingUp size={12} />;
    if (changeType === 'negative') return <TrendingDown size={12} />;
    return <Minus size={12} />;
  };

  return (
    <div className={`stat-card ${className}`}>
      <div className="stat-card-top">
        <span className="stat-card-label">{title}</span>
        {IconComponent && (
          <div className="stat-card-icon-wrap" aria-hidden="true">
            {React.isValidElement(IconComponent) ? IconComponent : <IconComponent size={20} />}
          </div>
        )}
      </div>

      <div className="stat-card-value">{value}</div>

      <div className="stat-card-bottom">
        {change && (
          <span className={`stat-badge ${changeType}`}>
            {renderTrendIcon()}
            <span>{change}</span>
          </span>
        )}
        {subtext && <span className="stat-card-subtext">{subtext}</span>}
      </div>
    </div>
  );
}
