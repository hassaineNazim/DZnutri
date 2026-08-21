import { RefreshCw } from 'lucide-react';

export const PageHeader = ({ eyebrow, title, accent, aside }) => (
  <div className="admin-page-header">
    <div>
      <div className="admin-eyebrow">{eyebrow}</div>
      <h1 className="admin-page-title">
        {title} {accent && <span>{accent}</span>}
      </h1>
    </div>
    {aside && <div className="admin-page-aside">{aside}</div>}
  </div>
);

export const StatusBadge = ({ children, tone = 'burgundy' }) => (
  <span className={`admin-status-badge admin-status-${tone}`}>{children}</span>
);

export const StatePanel = ({ loading = false, children }) => (
  <div className="admin-state-panel">
    {loading && <RefreshCw className="admin-spin" size={24} aria-hidden="true" />}
    <span>{children}</span>
  </div>
);

export const initialsFor = (name = '') => {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  return initials || '?';
};

