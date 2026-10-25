import React from 'react';

export function StatusBadge({ status }) {
  switch (status) {
    case 'Open':
      return <span className="badge badge-open">Open</span>;
    case 'In Progress':
      return <span className="badge badge-inprogress">In Progress</span>;
    case 'Resolved':
      return <span className="badge badge-resolved">Resolved</span>;
    case 'Closed':
      return <span className="badge badge-closed">Closed</span>;
    default:
      return <span className="badge badge-closed">{status}</span>;
  }
}

export function PriorityBadge({ priority }) {
  switch (priority) {
    case 'Critical':
      return <span className="badge badge-critical">Critical</span>;
    case 'High':
      return <span className="badge badge-high">High</span>;
    case 'Medium':
      return <span className="badge badge-medium">Medium</span>;
    case 'Low':
      return <span className="badge badge-low">Low</span>;
    default:
      return <span className="badge badge-low">{priority}</span>;
  }
}

export function BookStatusBadge({ status }) {
  if (status === 'Published & Live') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.15rem 0.5rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: '#dcfce7',
        color: '#15803d',
        border: '1px solid #bbf7d0'
      }}>
        Published & Live
      </span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.15rem 0.5rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      backgroundColor: '#fef3c7',
      color: '#b45309',
      border: '1px solid #fde68a'
    }}>
      {status}
    </span>
  );
}

export function CategoryBadge({ category }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.15rem 0.5rem',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: 500,
      background: '#f1f5f9',
      color: '#475569',
      border: '1px solid #e2e8f0'
    }}>
      {category}
    </span>
  );
}
