# 🍃 BookLeaf Publishing — Author Support & Communication Portal

An intelligent, full-stack Author Support & Communication Portal engineered for **BookLeaf Publishing**, designed to streamline author support at scale across thousands of authors and 22,000+ titles.

The system features two interconnected real-time interfaces:
1. **Author-Facing Portal**: Secure dashboard where authors inspect book sales, royalties (earned, paid, pending), raise support tickets with pre-filled context, and communicate with the operations desk in real time.
2. **Admin Operations Workbench**: Operations dashboard featuring an urgent-first ticket queue, **AI-Powered Auto-Classification**, **AI Priority Scoring**, confidential internal notes, 360-degree author context, and the **AI-Drafted Response Studio** powered by BookLeaf's knowledge base and communication tone guidelines.

---

## ⚡ Quick Start & Setup Instructions

### Prerequisites
- **Node.js** v18+ (tested on Node v20, v22, and v24)
- **npm** v9+

### 1. Clone & Install
```bash
git clone <repo-url>
cd bookleaf-author-portal

# Install all dependencies (both server and client)
npm run install:all
```

### 2. Configure Environment Variables
Copy the example environment configuration into `server/.env`:
```bash
cp server/.env.example server/.env
```
The server is pre-configured to run out of the box with an intelligent **BookLeaf Heuristic Expert Engine** that enforces 100% of the Knowledge Base policies even without external API keys.

To use external LLMs (OpenAI, Anthropic Claude, or Google Gemini), add your API key in `server/.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=bookleaf_jwt_secure_secret_key_2026_dev_key
CLIENT_URL=http://localhost:5173

# Optional LLM API Keys (auto-detected when present):
OPENAI_API_KEY=your_openai_api_key_here
# or ANTHROPIC_API_KEY=your_anthropic_api_key_here
# or GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Seed the Database
Pre-seed the database with the exact 10 authors and 18 books provided in `bookleaf_sample_data.json`:
```bash
npm run seed
```

### 4. Run the Project
Launch both the backend API server and frontend client concurrently:
```bash
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Interactive Swagger OpenAPI Docs**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

---

## 🔑 Test Login Credentials

For quick evaluation, the portal includes an **Instant Demo Switcher** directly in the top navigation bar. You can also sign in manually with these pre-seeded accounts:

| Role | Name | Email | Password | Notable Features / Context |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Admin Operations Desk | `admin@bookleaf.in` | `admin123` | Full access to ticket queue, AI workbench, status overrides |
| **Admin** | Neha Sharma (Lead) | `neha.support@bookleaf.in` | `admin123` | Support escalation agent |
| **Author** | Priya Sharma | `priya.sharma@email.com` | `author123` | 2 published books • Pending royalty payout (₹3,570) |
| **Author** | Rohit Kapoor | `rohit.kapoor@email.com` | `author123` | 2 published books • High sales volume (1,203 copies) |
| **Author** | Sneha Kulkarni | `sneha.kulkarni@email.com` | `author123` | 3 books • Edge case: Book in production (*Midnight in Mysore*) |
| **Author** | Kavita Deshmukh | `kavita.deshmukh@email.com` | `author123` | 2 books • Edge case: In production typesetting (*Raising Roots*) |
| **Author** | Diya Chatterjee | `diya.chatterjee@email.com` | `author123` | 2 books (*Durga's Daughters*, *Howrah Nights*) |

*All other authors from `bookleaf_sample_data.json` can also log in with their email and password `author123`.*

---

## 🏗 Architecture Decisions & Why We Made Them

```
bookleaf-author-portal/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                # SQLite with WAL mode & foreign keys (native node:sqlite)
│   │   │   └── knowledgeBase.js     # Authoritative BookLeaf KB, policies & tone rules
│   │   ├── services/
│   │   │   ├── aiService.js         # Multi-provider LLM engine, RAG selector & fallback
│   │   │   ├── dbService.js         # Data access layer & database seeder
│   │   │   └── sseService.js        # Server-Sent Events real-time event broadcaster
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT authentication & session verification
│   │   │   ├── rbac.js              # Role-Based Access Control (Author vs Admin)
│   │   │   └── errorHandler.js      # Centralized error & 404 handler
│   │   ├── routes/
│   │   │   ├── auth.routes.js       # Authentication & demo switching endpoints
│   │   │   ├── authors.routes.js    # Author metrics & books endpoints
│   │   │   ├── books.routes.js      # Book catalog endpoints
│   │   │   └── tickets.routes.js    # Ticket lifecycle, messaging & AI drafts
│   │   ├── openapi.yaml             # Complete OpenAPI 3.0 specification
│   │   └── index.js                 # Express server bootstrap & Swagger mounting
│   ├── bookleaf_api.postman_collection.json # Exportable Postman collection
│   └── data/
│       ├── bookleaf.db              # SQLite relational database
│       └── bookleaf_sample_data.json# Canonical dataset
│
└── client/
    ├── src/
    │   ├── components/
    │   │   ├── AuthorPortal/        # Author Workspace, My Books, Submit Ticket, My Tickets
    │   │   ├── AdminPortal/         # Global Ticket Queue, Ticket Detail Workbench, AI Studio
    │   │   └── Common/              # Badges, Navbar, Demo Switcher, Login
    │   ├── context/
    │   │   └── AuthContext.jsx      # Global auth state & seamless user switching
    │   ├── services/
    │   │   └── api.js               # REST client & Server-Sent Events client
    │   ├── index.css                # Glassmorphic emerald publishing design system
    │   └── App.jsx                  # Main view orchestration & real-time toast alerts
```

### 1. Separation of Concerns & Clean Architecture
- **Backend (Node.js + Express)**: A modular layer separating route controllers, business logic services (`aiService`, `sseService`, `dbService`), data schemas, and security middleware.
- **Relational Schema (SQLite with `node:sqlite`)**: Chosen because the domain model has clear relationships: authors own books; tickets reference authors and books; tickets have message threads, AI drafts, and internal notes. Using Node's native standard library SQLite provides zero external native compilation friction on any platform while guaranteeing ACID transactions and fast sub-millisecond queries.

### 2. Role-Based Access Control (RBAC) & Data Privacy
- **Strict Data Isolation**: Authors can only view and query their own books, metrics, and support tickets (`t.author_id = req.user.author_id`).
- **Internal Notes Confidentiality**: BookLeaf operations staff can write private notes (e.g. tracking bank IFSC corrections, warehouse reprint batches). The backend explicitly strips `ticket.notes` whenever an author requests a ticket.
- **Role Elevation Protection**: Only authenticated admins can modify ticket statuses, override AI classifications, change priority scores, or write internal notes.

### 3. Real-Time Synchronization via Server-Sent Events (SSE)
- Rather than demanding heavy WebSocket brokers or polling loops, the portal uses **Server-Sent Events (SSE)** via `/api/tickets/events`.
- SSE connects through standard HTTP, auto-reconnects natively in browsers, and broadcasts events (`TICKET_CREATED`, `TICKET_UPDATED`, `NEW_MESSAGE`, `INTERNAL_NOTE_ADDED`).
- Internal note events are strictly filtered at the server broadcaster to only push to connected admin clients.

---

## 🤖 AI Integration: Prompt Strategy, Error Handling & Cost Awareness

### 1. Prompt Engineering & Tone Alignment
BookLeaf support represents a high-trust partner relationship with authors. The AI prompt enforces:
1. **Direct Acknowledgement**: Empathize with the author's specific concern before proposing solutions.
2. **Contextual Awareness**: The prompt automatically injects the author's real records: book title, publication status, copies sold, royalty paid, royalty pending, and last payout date.
3. **Strict Policy Compliance**: Adheres to the 80/20 net profit split (MRP minus printing, platform commission, shipping), quarterly payout cycles (within 45 days of quarter close), ₹1,000 threshold, and free reprint guarantees for verified defects within 5–7 days.
4. **Concrete Timelines**: Pledges specific timelines (e.g. 48-hour escalation for royalties/ISBN errors) rather than vague reassurances.

### 2. Cost-Consciousness & Token Minimization
- **Targeted RAG Chunking**: Instead of injecting the entire BookLeaf knowledge base on every LLM call, `aiService.getRelevantKnowledgeContext()` dynamically selects only the relevant policy segment based on query intent and candidate category.
- **Compact Author Context**: Only pertinent KPI figures are passed, trimming unnecessary object noise.
- **Token Budgeting**: Responses are bounded with a 450 max-token ceiling and low temperature (0.1–0.3) to prevent hallucination, minimize latency, and keep cost per ticket query below a fraction of a cent.

### 3. Graceful Degradation & Fallback Heuristic Engine
If the external LLM API is unavailable, throttled by rate limits, or if no API key is configured:
- The system **never crashes or blocks ticket submission**.
- An intelligent rule-based expert engine steps in immediately, accurately classifying the query into one of the 6 required categories, assessing priority (Critical / High / Medium / Low) with transparent reasoning, and formulating a policy-compliant draft response.
- Admins maintain full discretion to edit drafts and override any classification or priority score.

---

## 📡 API Documentation

Interactive Swagger OpenAPI UI is accessible directly at:
👉 **[http://localhost:5000/api/docs](http://localhost:5000/api/docs)**

A complete Postman Collection is also provided in the repository:
📄 [`server/bookleaf_api.postman_collection.json`](file:///C:/Users/Amit%20Computers/.gemini/antigravity-ide/scratch/bookleaf-author-portal/server/bookleaf_api.postman_collection.json)

### Core Endpoints Summary

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates user (author/admin) and returns JWT token |
| `GET` | `/api/auth/me` | Authenticated | Returns current profile and author record |
| `GET` | `/api/auth/demo-users` | Public | Returns seeded test accounts for one-click demo login |
| `POST` | `/api/auth/seed` | Public | Resets database back to default dataset |
| `GET` | `/api/authors` | Admin | Lists all authors with aggregated KPI figures |
| `GET` | `/api/authors/:id/books` | Author/Admin | Lists author's books with sales & royalty breakdown |
| `GET` | `/api/authors/:id/metrics` | Author/Admin | Returns aggregated KPI cards stats (sold, earned, paid, pending) |
| `GET` | `/api/tickets` | Author/Admin | Lists tickets (authors restricted to self; admins filter by status, priority, category, sort) |
| `POST` | `/api/tickets` | Author | Raises a support ticket; triggers AI classification & priority scoring |
| `GET` | `/api/tickets/:id` | Author/Admin | Gets ticket details & message thread (internal notes stripped for author) |
| `PATCH` | `/api/tickets/:id` | Admin | Updates status, assignee, or overrides category / priority |
| `POST` | `/api/tickets/:id/messages` | Author/Admin | Appends message reply to the ticket thread |
| `POST` | `/api/tickets/:id/notes` | Admin | Appends confidential internal note (hidden from author) |
| `POST` | `/api/tickets/:id/ai-draft` | Admin | Generates or regenerates AI draft response using Knowledge Base |
| `GET` | `/api/tickets/events` | Authenticated | Server-Sent Events stream for real-time ticket synchronization |

---

## 🧪 Automated Testing

Run the automated test suite to verify database seeding, RBAC isolation, and AI auto-classification against the benchmark queries from the assignment brief:
```bash
npm run test
```
All test cases validate:
- Accurate classification of royalty delays (Critical), ISBN mismatches (Critical), printing quality defects (High), distribution stockouts (High), production updates (Medium), and general bio updates (Low).
- Strict redaction of internal notes on author requests.
- Edge case handling of titles in production with zero/null royalties.

---

## 📈 Known Limitations & Production Roadmap
- **Production File Storage**: Current attachment support handles preview and metadata simulation; in production this would integrate with S3 / Cloudflare R2 with pre-signed upload URLs.
- **Email / WhatsApp Webhooks**: In a live system, author responses would mirror to WhatsApp Business API and SendGrid so authors can reply directly from their email client.
- **Automated Re-sync Webhooks**: For "Distribution & Availability" tickets, the AI workbench could offer a one-click button to directly trigger inventory catalog sync APIs with Amazon and Flipkart.
