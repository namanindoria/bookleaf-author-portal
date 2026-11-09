# 🍃 BookLeaf Publishing — Assignment 2
## Author Royalty Dashboard & Automated Notification System (Bubble.io + n8n)

### 📌 Project Overview
This repository contains the architecture, workflow automation exports, data seed files, and setup instructions for **BookLeaf Publishing Technical Assignment 2 of 2**.

The system integrates a **Bubble.io** operational dashboard with an **n8n** automation backend to enable authors to track live book royalties and allow operations staff to trigger AI-generated, policy-accurate royalty statements.

---

### 🚀 Submission Links & Credentials

1. **Bubble Application URL**: [https://rishisharmabtp19.bubbleapps.io/version-test](https://rishisharmabtp19.bubbleapps.io/version-test)
2. **Bubble Editor Access**: Added collaborator `musavir@bookleafpub.in`
3. **n8n Workflow Export**: [`bookleaf_n8n_royalty_workflow.json`](./bookleaf_n8n_royalty_workflow.json)
4. **Test Accounts**:
   - **Admin / Operations Lead**: `admin@bookleaf.in` | Password: `admin123`
   - **Author 1 (Priya Sharma)**: `priya.sharma@email.com` | Password: `author123` *(2 books, ₹3,570 pending)*
   - **Author 2 (Sneha Kulkarni)**: `sneha.kulkarni@email.com` | Password: `author123` *(3 books, 'Midnight in Mysore' in production)*

---

### 🏛️ Bubble Database Architecture & Schema Design

The Bubble database is structured with strict relational entity boundaries:

#### 1. `Author` Data Type
- `author_id` (text): Unique identifier (e.g., `AUTH001`)
- `name` (text): Full name
- `email` (text): Linked account email
- `phone` (text): Contact number
- `city` (text): City of residence (for admin location filtering)
- `joined_date` (text / date): Registration date
- `total_books` (number): Aggregate book count
- `total_royalty_earned` (number): Cumulative gross royalty
- `total_royalty_paid` (number): Cumulative paid royalty
- `total_royalty_pending` (number): Net outstanding balance
- `payout_status` (text): Categorized as `fully paid`, `pending`, or `overdue`

#### 2. `Book` Data Type
- `book_id` (text): Unique ID (e.g., `BK001`)
- `author_id` (text): Foreign key reference to Author
- `author_name` (text): Denormalized author name for high-performance repeating groups
- `title` (text): Book title
- `isbn` (text): Official ISBN
- `genre` (text): Literary category
- `status` (text): `Published & Live`, `In Production - Cover Design`, etc.
- `mrp` (number): Retail price in INR
- `author_royalty_per_copy` (number): Author contractual payout per copy
- `total_copies_sold` (number): Volume sales
- `total_royalty_earned` (number): Copies sold $\times$ Royalty/copy
- `royalty_paid` (number): Disbursed amount
- `royalty_pending` (number): Unpaid amount
- `last_royalty_payout_date` (text / date): Last cycle disbursement
- `print_partner` (text): `In-House`, `Repro India`, or `Epitome Books`
- `available_on` (text): Channels (Amazon India, Flipkart, BookLeaf Store)
- `royalty_status_badge` (text): `Green` (fully paid), `Yellow` (pending within cycle), `Red` (overdue >90d), `Grey` (in production)

#### 3. `Notification_Log` Data Type
- `log_id` (text): Event identifier
- `author_id` (text): Target author
- `author_name` (text): Author name
- `author_email` (text): Destination email
- `triggered_at` (date): Execution timestamp
- `status` (text): `Success` or `Failed`
- `summary_preview` (text): AI-generated summary snippet
- `full_email` (text): Full formatted email draft

---

### 🔒 Bubble Privacy Rules

Strict privacy rules enforce author data isolation as mandated in requirement **A4**:

1. **`Author` Data Type**:
   - *Rule 1 (Admins)*: `Current User's user_type is "admin"` $\rightarrow$ Full access to view, search, and edit all author records.
   - *Rule 2 (Author Isolation)*: `Current User's email is This Author's email` $\rightarrow$ Author can only view their own record.
   - *Default*: No access to other logged-in authors or public visitors.

2. **`Book` Data Type**:
   - *Rule 1 (Admins)*: `Current User's user_type is "admin"` $\rightarrow$ View all books across all authors.
   - *Rule 2 (Authors)*: `Current User's author_id is This Book's author_id` $\rightarrow$ View only books owned by them.
   - *Default*: Blocked from other authors.

---

### ⚡ Bubble $\leftrightarrow$ n8n Integration Architecture

```
[ Bubble.io Admin UI ]
   │
   ├─► Click "Generate & Send Royalty Summary" (Single or Bulk)
   │
   ▼
[ HTTP POST Request (Bubble API Connector) ]
   │   Header: x-bookleaf-secret: bookleaf_secure_webhook_secret_2026
   │   Payload: { author_id, author_name, total_earned, total_paid, total_pending, books: [...] }
   ▼
[ n8n Webhook Node ]
   │
   ├─► [ Security Check Node ]: Validates secret token (Returns 401 on mismatch)
   │
   ├─► [ Data Normalization Node ]: Formats author sales and catalog lists
   │
   ├─► [ Knowledge Base Prompt Engine ]: Injects BookLeaf 80/20 & quarterly cycle rules
   │
   ├─► [ AI Generator Node ]: Produces personalized, empathetic statement
   │
   ├─► [ Respond to Webhook Node ]: Returns HTTP 200 { status: "Success", full_email, summary_preview }
   │
   ▼
[ Bubble Action: Create new Notification_Log ]
   │   Updates live admin notification table instantaneously
   └─► Display notification alert to admin
```

---

### 🤖 AI Prompt Strategy & Tone Calibration

The prompt enforces BookLeaf's exact operating guidelines:
- **80/20 Net Profit Policy**: Explicitly reminds the author of the 80/20 royalty split after production and retail fees.
- **Quarterly Calendar Schedule**: Clearly states that royalties are calculated quarterly and disbursed within 45 days of the quarter ending.
- **₹1,000 Payout Threshold**: If pending amount $\ge ₹1,000$, details the direct bank transfer timeline; if $< ₹1,000$, warmly explains that funds roll over to the next cycle.
- **Empathetic Partner Tone**: Authors are treated as creative partners; acknowledgements are specific, numbers-driven, and devoid of corporate deflection.

---

### 🛡️ Error Handling, Idempotency & Edge Cases

1. **Webhook Security**: The n8n endpoint validates an `x-bookleaf-secret` authentication header. Any unauthenticated requests immediately terminate with HTTP 401.
2. **Bubble UI Responsiveness**: The Bubble workflow disables the trigger button while processing to prevent rapid double-clicks (idempotency protection).
3. **Graceful Fallback**: If an upstream AI API rate-limits or fails, the workflow gracefully catches the error and responds with formatted policy text or logs status as `Failed` without leaving the user hanging.
4. **Edge Cases**:
   - *Authors with ₹0 payouts*: Generates a celebratory zero-pending statement.
   - *Books in Production* (*Midnight in Mysore*): Acknowledges current production phase without erroneous zero-sales penalties.

---

### 📦 Files in this Directory
- `bookleaf_n8n_royalty_workflow.json`: Ready-to-import n8n workflow.
- `authors.csv`: Pre-calculated CSV with all 10 authors + 1 admin ready for Bubble data import.
- `books.csv`: All 18 books with pre-calculated status badges (Green/Yellow/Red/Grey).
- `notification_logs.csv`: Schema template for notification history.
- `README.md`: This comprehensive documentation file.
