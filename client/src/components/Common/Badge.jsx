import React from 'react';
import { AlertCircle, Clock, CheckCircle2, XCircle, Flame, AlertTriangle, Info } from 'lucide-react';

export function StatusBadge({ status }) {
  switch (status) {
    case 'Open':
      return (
        <span className="badge badge-open">
          <Clock size={12} /> Open
        </span>
      );
    case 'In Progress':
      return (
        <span className="badge badge-inprogress">
          <AlertCircle size={12} /> In Progress
        </span>
      );
    case 'Resolved':
      return (
        <span className="badge badge-resolved">
          <CheckCircle2 size={12} /> Resolved
        </span>
      );
    case 'Closed':
      return (
        <span className="badge badge-closed">
          <XCircle size={12} /> Closed
        </span>
      );
    default:
      return <span className="badge badge-closed">{status}</span>;
  }
}

export function PriorityBadge({ priority }) {
  switch (priority) {
    case 'Critical':
      return (
        <span className="badge badge-critical">
          <Flame size={12} /> Critical
        </span>
      );
    case 'High':
      return (
        <span className="badge badge-high">
          <AlertTriangle size={12} /> High
        </span>
      );
    case 'Medium':
      return (
        <span className="badge badge-medium">
          <Info size={12} /> Medium
        </span>
      );
    case 'Low':
      return (
        <span className="badge badge-low">
          <Clock size={12} /> Low
        </span>
      );
    default:
      return <span className="badge badge-low">{priority}</span>;
  }
}

export function BookStatusBadge({ status }) {
  if (status === 'Published & Live') {
    return (
      <span className="badge badge-resolved" style={{ fontSize: '0.7rem' }}>
        <CheckCircle2 size={11} /> Published & Live
      </span>
    );
  }
  return (
    <span className="badge badge-inprogress" style={{ fontSize: '0.7rem' }}>
      <Clock size={11} /> {status}
    </span>
  );
}

export function CategoryBadge({ category }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.2rem 0.55rem',
      borderRadius: '6px',
      fontSize: '0.72rem',
      fontWeight: '600',
      background: 'rgba(255, 255, 255, 0.05)',
      color: 'var(--text-muted)',
      border: '1px solid var(--border-subtle)'
    }}>
      {category}
    </span>
  );
}
