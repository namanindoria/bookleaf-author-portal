# Architectural Approach & Production Evolution

**Candidate:** Full-Stack Developer Applicant  
**Position:** Full Stack Developer, BookLeaf Publishing  
**Project:** Author Support & Communication Portal  

---

### 1. What I Prioritised

1. **AI Grounding & Empathy Over Generic Chatbot Fluff:**
   In publishing, authors are artistic partners with deep emotional investment in their work. I prioritised feeding the AI exact relational context (the author's actual books, sold copies, pending royalties, and last payout date) along with BookLeaf's specific policy rules (the 80/20 net profit split, quarterly cycles within 45 days, and free reprint guarantees). This produces responses that sound like experienced operations leads—direct, transparent, and empathetic—rather than generic AI platitudes.

2. **Graceful Degradation as a Hard Requirement:**
   Third-party LLMs experience rate limits, outages, and network latency. The architecture prioritises resilience: ticket creation never blocks on external APIs. If an LLM call fails or API keys are missing, the system automatically falls back to an internal heuristic expert engine that accurately categorises, scores priority, and prepares an authentic BookLeaf policy draft.

3. **Operational Clarity in High-Volume Support:**
   Support agents handling 1,200+ monthly books suffer from cognitive overload. I prioritised an **Urgent-First Triage** mechanism that highlights critical delays (overdue royalties, ISBN mismatches) with visual indicators, pairs incoming queries with 360-degree author context, and provides a 1-click **AI-Drafted Response Studio** where admins can review, customize, and dispatch replies in seconds.

4. **Real-Time Collaboration Without Polling Overhead:**
   I prioritised Server-Sent Events (SSE) so authors and operations leads experience instantaneous updates across tabs without manual refreshes, while keeping server resource consumption lightweight and predictable.

---

### 2. Trade-Offs Made

- **Native SQLite over Managed PostgreSQL:**
  For the assignment and evaluation environment, zero-friction setup is critical. Using Node's native SQLite provides sub-millisecond query performance, clean foreign-key relational integrity, and zero compilation hurdles across platforms. The trade-off is horizontal concurrency limits, which is solved in production by switching the data access layer to PostgreSQL or CockroachDB.
- **Server-Sent Events (SSE) over Full Duplex WebSockets:**
  SSE was chosen over WebSockets because ticket support communication is fundamentally event-driven (new messages, status changes, notes) while standard POST/PATCH requests handle client-to-server operations with full HTTP semantics, caching, and auth middleware. This significantly reduced architectural complexity without sacrificing perceived real-time responsiveness.
- **UI File Attachment Simulation over S3 Integration:**
  To keep local setup self-contained without requiring AWS IAM credentials, attachments support client-side preview, validation, and metadata simulation rather than direct S3 multipart uploading.

---

### 3. How I Would Evolve This Into a Production System

1. **Multi-Channel Author Ingestion (Omnichannel Support):**
   Indian authors heavily use WhatsApp and email. I would integrate Twilio / Gupshup WhatsApp Business APIs and SendGrid inbound parsing so authors can reply directly from WhatsApp or email threads, syncing bidirectionally into the portal workbench.

2. **Automated Integration with Print & Distribution Feeds:**
   - For **ISBN & Metadata Issues**, hook directly into Nielsen/ISBN agency APIs to automatically verify imprint registry.
   - For **Distribution Stock Sync**, provide a 1-click "Trigger Retail Re-sync" button in the admin workbench that calls Amazon SP-API and Repro India's inventory sync webhook.

3. **Advanced Semantic Retrieval & Few-Shot Author Feedback:**
   Transition the keyword/rule retrieval into a hybrid vector search (e.g. pgvector) indexing historical resolved tickets. When an author writes in, the AI workbench can suggest the top 3 highest-rated responses previously sent by senior BookLeaf representatives.

4. **Comprehensive Observability & SLA Tracking:**
   Implement Prometheus/Grafana metrics tracking Time-to-First-Response (TTFR), resolution SLA adherence (flagging any critical royalty ticket nearing the 48-hour threshold), and agent AI-edit distance to measure how often drafts are accepted without modification.
