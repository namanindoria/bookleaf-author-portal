import React from 'react';
import { BarChart3, Download } from 'lucide-react';

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
  const resolvedOrClosed = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
  const resolutionRate = Math.round((resolvedOrClosed / total) * 100) || 0;

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
    link.setAttribute("download", `bookleaf_tickets_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="clean-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <BarChart3 size={16} color="#0f766e" />
            Operations Overview & SLA Metrics
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Key operational metrics across author communications
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="btn btn-secondary btn-sm"
        >
          <Download size={13} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Metric row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Tickets</span>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{total}</div>
        </div>

        <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Resolution Rate</span>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#16a34a', marginTop: '2px' }}>{resolutionRate}%</div>
        </div>

        <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Critical & High</span>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: critical > 0 ? '#be123c' : '#b45309', marginTop: '2px' }}>
            {critical + high}
          </div>
        </div>

        <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>SLA Target</span>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f766e', marginTop: '2px' }}>48 Hours</div>
        </div>
      </div>

      {/* Category Bars */}
      <div>
        <span style={{ fontSize: '0.725rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
          Breakdown by Category:
        </span>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem' }}>
          {categoryCounts.map((cat, idx) => (
            <div key={idx} style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 500, color: '#334155' }}>{cat.name}</span>
                <span style={{ color: '#0f766e', fontWeight: 600 }}>{cat.count} ({cat.percentage}%)</span>
              </div>
              <div style={{ height: '4px', width: '100%', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${cat.percentage}%`, background: '#0f766e', borderRadius: '2px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
