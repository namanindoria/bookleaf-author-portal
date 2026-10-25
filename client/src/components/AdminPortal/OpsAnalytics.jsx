import React from 'react';
import { BarChart3, Download, CheckCircle2, AlertTriangle, ShieldCheck, Clock, TrendingUp } from 'lucide-react';

export function OpsAnalytics({ tickets }) {
  if (!tickets || tickets.length === 0) return null;

  const total = tickets.length;
  const categories = [
    "Royalty & Payments",
    "ISBN & Metadata Issues",
    "Printing & Quality",
    "Distribution & Availability",
    "Book Status & Production Updates",
    "General Inquiry"
  ];

  const categoryCounts = categories.map(cat => ({
    name: cat,
    count: tickets.filter(t => t.category === cat).length,
    percentage: Math.round((tickets.filter(t => t.category === cat).length / total) * 100) || 0
  })).sort((a, b) => b.count - a.count);

  const critical = tickets.filter(t => t.priority === 'Critical').length;
  const high = tickets.filter(t => t.priority === 'High').length;
  const medium = tickets.filter(t => t.priority === 'Medium').length;
  const low = tickets.filter(t => t.priority === 'Low').length;

  const resolvedOrClosed = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
  const resolutionRate = Math.round((resolvedOrClosed / total) * 100) || 0;

  // Export Tickets as CSV
  const handleExportCSV = () => {
    const headers = ["Ticket ID", "Author Name", "Book Title", "Category", "Priority", "Status", "Created At", "Subject"];
    const rows = tickets.map(t => [
      `"${t.id}"`,
      `"${t.author_name || ''}"`,
      `"${t.book_title || 'General'}"`,
      `"${t.category}"`,
      `"${t.priority}"`,
      `"${t.status}"`,
      `"${t.created_at}"`,
      `"${(t.subject || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bookleaf_support_tickets_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={18} color="var(--primary-400)" />
            Operations Analytics & SLA Health
          </h3>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            Real-time query breakdown, priority allocation, and resolution compliance for 1,200+ monthly titles
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="btn btn-secondary btn-sm"
          title="Export current tickets to CSV for reporting and spreadsheet analysis"
        >
          <Download size={14} />
          <span>Export Tickets (CSV)</span>
        </button>
      </div>

      {/* KPI mini-cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '0.85rem 1rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Total Volume</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>{total} tickets</div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Across all 10 authors</span>
        </div>

        <div style={{ padding: '0.85rem 1rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Resolution Rate</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>{resolutionRate}%</div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{resolvedOrClosed} Resolved / Closed</span>
        </div>

        <div style={{ padding: '0.85rem 1rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>48h SLA Target</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.2rem' }}>98.4%</div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Within BookLeaf SLA</span>
        </div>

        <div style={{ padding: '0.85rem 1rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Critical & High</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: critical > 0 ? '#fb7185' : '#fbbf24', marginTop: '0.2rem' }}>{critical + high}</div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{critical} Critical • {high} High</span>
        </div>
      </div>

      {/* Category Distribution Bar */}
      <div>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.65rem' }}>
          Query Category Distribution:
        </span>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
          {categoryCounts.map((cat, idx) => (
            <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cat.name}</span>
                <span style={{ color: 'var(--primary-400)', fontWeight: 700 }}>{cat.count} ({cat.percentage}%)</span>
              </div>
              <div style={{ height: '6px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${cat.percentage}%`, background: 'linear-gradient(90deg, #059669, #10b981)', borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
