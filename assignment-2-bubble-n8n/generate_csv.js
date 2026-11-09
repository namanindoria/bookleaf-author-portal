const fs = require('fs');
const path = require('path');

const sampleDataPath = path.join(__dirname, 'bookleaf_sample_data.json');
const data = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));

// 1. Authors CSV
const authorsHeader = 'author_id,name,email,phone,city,joined_date,user_type,total_books,total_royalty_earned,total_royalty_paid,total_royalty_pending,payout_status\n';
const authorsRows = data.authors.map(a => {
  let earned = 0;
  let paid = 0;
  let pending = 0;
  let hasOverdue = false;
  const now = new Date('2026-11-09');

  for (const b of a.books) {
    earned += (b.total_royalty_earned || 0);
    paid += (b.royalty_paid || 0);
    pending += (b.royalty_pending || 0);

    // Overdue logic: pending amount exists and last payout > 90 days ago OR no payout for published book > 90 days
    if ((b.royalty_pending || 0) > 0) {
      if (b.last_royalty_payout_date) {
        const lastPayout = new Date(b.last_royalty_payout_date);
        const daysSince = (now - lastPayout) / (1000 * 60 * 60 * 24);
        if (daysSince > 90) hasOverdue = true;
      } else if (b.status === 'Published & Live' && b.publication_date) {
        const pubDate = new Date(b.publication_date);
        const daysSincePub = (now - pubDate) / (1000 * 60 * 60 * 24);
        if (daysSincePub > 90) hasOverdue = true;
      }
    }
  }

  let status = 'fully paid';
  if (hasOverdue) {
    status = 'overdue';
  } else if (pending > 0) {
    status = 'pending';
  }

  return `"${a.author_id}","${a.name}","${a.email}","${a.phone}","${a.city}","${a.joined_date}","author",${a.books.length},${earned},${paid},${pending},"${status}"`;
}).join('\n');

const adminRow = `"ADMIN001","Admin Operations Desk","admin@bookleaf.in","+91-99999-00000","Delhi","2023-01-01","admin",0,0,0,0,"fully paid"`;
fs.writeFileSync(path.join(__dirname, 'authors.csv'), authorsHeader + authorsRows + '\n' + adminRow + '\n');

// 2. Books CSV
const booksHeader = 'book_id,author_id,author_name,title,isbn,genre,publication_date,status,mrp,author_royalty_per_copy,total_copies_sold,total_royalty_earned,royalty_paid,royalty_pending,last_royalty_payout_date,print_partner,available_on,royalty_status_badge\n';
const booksRows = [];
const now = new Date('2026-11-09');

for (const a of data.authors) {
  for (const b of a.books) {
    const avail = (b.available_on || []).join('; ');
    const pending = b.royalty_pending || 0;
    
    // Badge logic: Green, Yellow, Red
    let badge = 'Green';
    if (pending === 0 && b.status === 'Published & Live') {
      badge = 'Green';
    } else if (pending > 0) {
      let isOverdue = false;
      if (b.last_royalty_payout_date) {
        const lastPayout = new Date(b.last_royalty_payout_date);
        const diffDays = (now - lastPayout) / (1000 * 60 * 60 * 24);
        if (diffDays > 90) isOverdue = true;
      } else if (b.status === 'Published & Live' && b.publication_date) {
        const pubDate = new Date(b.publication_date);
        const diffDays = (now - pubDate) / (1000 * 60 * 60 * 24);
        if (diffDays > 90) isOverdue = true;
      }
      badge = isOverdue ? 'Red' : 'Yellow';
    } else if (b.status !== 'Published & Live') {
      badge = 'Grey'; // In production
    }

    booksRows.push(
      `"${b.book_id}","${a.author_id}","${a.name}","${b.title}","${b.isbn || ''}","${b.genre || ''}","${b.publication_date || ''}","${b.status}",${b.mrp || 0},${b.author_royalty_per_copy || 0},${b.total_copies_sold || 0},${b.total_royalty_earned || 0},${b.royalty_paid || 0},${pending},"${b.last_royalty_payout_date || ''}","${b.print_partner || ''}","${avail}","${badge}"`
    );
  }
}
fs.writeFileSync(path.join(__dirname, 'books.csv'), booksHeader + booksRows.join('\n') + '\n');

// 3. Initial Notification Logs CSV (Sample structure)
const notifHeader = 'log_id,author_id,author_name,author_email,triggered_at,status,summary_preview,email_sent\n';
const notifSample = `"LOG001","AUTH001","Priya Sharma","priya.sharma@email.com","2026-11-09 14:00:00","Success","Royalty summary for Whispers of the Ganges & The Saffron Diaries generated with payout ETA.",true\n`;
fs.writeFileSync(path.join(__dirname, 'notification_logs.csv'), notifHeader + notifSample);

console.log('CSVs generated successfully:');
console.log('- Authors CSV:', data.authors.length + 1, 'records');
console.log('- Books CSV:', booksRows.length, 'records');
console.log('- Notification Logs CSV: initialized');
