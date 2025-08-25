import React from 'react';
import './ProBadge.css';

const ProBadge = ({ 
  type = 'PRO', 
  variant = 'primary', 
  size = 'sm',
  className = '',
  tooltip = null 
}) => {
  const badgeClass = `pro-badge pro-badge-${variant} pro-badge-${size} ${className}`;
  
  const badge = (
    <span className={badgeClass}>
      {type}
    </span>
  );

  // If tooltip is provided, wrap in a tooltip container
  if (tooltip) {
    return (
      <div className="pro-badge-tooltip-container">
        {badge}
        <div className="pro-badge-tooltip">
          {tooltip}
        </div>
      </div>
    );
  }

  return badge;
};

export const FeaturedBadge = ({ className = '', ...props }) => (
  <ProBadge 
    type="FEATURED" 
    variant="featured" 
    className={className}
    tooltip="This startup is featured by a Pro member"
    {...props} 
  />
);

export const VerifiedBadge = ({ className = '', ...props }) => (
  <ProBadge 
    type="✓" 
    variant="verified" 
    className={className}
    tooltip="Verified Pro member"
    {...props} 
  />
);

export const PremiumBadge = ({ className = '', ...props }) => (
  <ProBadge 
    type="PREMIUM" 
    variant="premium" 
    className={className}
    tooltip="Premium feature"
    {...props} 
  />
);

export const EnterpriseBadge = ({ className = '', ...props }) => (
  <ProBadge 
    type="ENTERPRISE" 
    variant="enterprise" 
    className={className}
    tooltip="Enterprise member"
    {...props} 
  />
);

export default ProBadge;