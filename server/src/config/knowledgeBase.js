/**
 * BookLeaf Publishing Knowledge Base & Tone Guidelines
 * Extracted directly from assignment brief context & guidelines.
 */

const BOOKLEAF_KNOWLEDGE_BASE = {
  companyOverview: {
    title: "Company Overview",
    points: [
      "BookLeaf Publishing is a self-publishing company operating in India and the US.",
      "We offer publishing packages: Standard Free (no upfront cost) and Bestseller Breakthrough (premium, paid package with marketing and distribution add-ons).",
      "We handle cover design, typesetting, ISBN assignment, printing, distribution, and royalty management for our authors.",
      "Our in-house printing facility and warehouse are located in Delhi. We also work with print partners including Repro India and Epitome Books."
    ]
  },

  royaltyPolicy: {
    title: "Royalty Policy",
    category: "Royalty & Payments",
    points: [
      "BookLeaf follows an 80/20 royalty split: 80% of the net profit per book goes to the author, 20% to BookLeaf.",
      "Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart), and shipping charges.",
      "Royalties are calculated quarterly and paid within 45 days of the quarter ending.",
      "Minimum payout threshold: ₹1,000. If accumulated royalties are below this, they roll over to the next quarter.",
      "Payouts are made via bank transfer to the account linked in the author's dashboard.",
      "Authors can view a detailed royalty breakdown in their dashboard, showing sales figures per platform."
    ]
  },

  isbnPolicy: {
    title: "ISBN Policy",
    category: "ISBN & Metadata Issues",
    points: [
      "Every book published through BookLeaf receives a unique ISBN assigned by BookLeaf.",
      "ISBNs are registered under BookLeaf's publisher imprint. If an author wants an ISBN under their own imprint, they need to obtain it independently.",
      "If an author reports an ISBN error (duplicate, wrong book linked), it is treated as a high-priority issue and escalated to the production team immediately (48-hour resolution timeline)."
    ]
  },

  printingAndQuality: {
    title: "Printing & Quality",
    category: "Printing & Quality",
    points: [
      "In-house printing handles most orders. Overflow or specific format requirements go to Repro India or Epitome Books.",
      "Standard print turnaround: 5–7 business days from order confirmation.",
      "If an author reports a quality issue (misprints, binding defects, color inconsistency), BookLeaf arranges a free reprint after verification.",
      "The author may need to share photos of the defective copy."
    ]
  },

  distributionAndAvailability: {
    title: "Distribution & Availability",
    category: "Distribution & Availability",
    points: [
      "Books are listed on Amazon India, Flipkart, Amazon US, Amazon UK, and the BookLeaf Store.",
      "New listings typically go live within 7–10 business days after publication is complete.",
      "If a book is showing as unavailable on a platform, it usually indicates a stock sync issue—BookLeaf's team can trigger a re-sync within 24–48 hours."
    ]
  },

  productionStages: {
    title: "Production Stages",
    category: "Book Status & Production Updates",
    points: [
      "A book goes through the following stages: Manuscript Received → Editing (if opted) → Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup → Published & Live.",
      "Authors are updated at each stage via email.",
      "Delays typically happen at Cover Design (waiting for author approval) and Proofreading (revision rounds)."
    ]
  },

  generalInquiry: {
    title: "General Inquiries & Metadata Updates",
    category: "General Inquiry",
    points: [
      "Metadata updates (book description, author bio, category tweaks) can be submitted through the dashboard or by emailing the BookLeaf team.",
      "Changes typically reflect on platforms within 3–5 business days."
    ]
  },

  toneGuidelines: [
    "Always empathetic and professional. Authors are our partners, not customers to be managed.",
    "Acknowledge the author's concern before jumping to solutions.",
    "Be specific: include actual numbers, dates, and statuses wherever possible rather than vague reassurances.",
    "If something is BookLeaf's fault (delayed royalties, ISBN error), own it directly. No corporate deflection.",
    "If the issue requires escalation or investigation, give a clear timeline ('Our team will look into this and get back to you within 48 hours') rather than open-ended promises.",
    "Always end with a clear next step for the author and/or the BookLeaf team."
  ],

  sampleQueryResponses: [
    {
      category: "Royalty & Payments",
      query: "I published my book 4 months ago and still haven't received any royalty. What's going on?",
      guidance: "Acknowledge the frustration. Explain the quarterly royalty cycle and 45-day payout window. Check if their bank details are linked. Provide the specific next payout date. If the payment is genuinely overdue, escalate with a 48-hour resolution timeline."
    },
    {
      category: "Royalty & Payments",
      query: "My royalty amount seems too low. I sold 200 copies but only received ₹3,000.",
      guidance: "Explain the net profit calculation: MRP minus printing, platform commission, and shipping. Offer to share a detailed line-by-line royalty breakdown. Don't be defensive—offer transparency."
    },
    {
      category: "ISBN & Metadata Issues",
      query: "My book is showing a different ISBN on Amazon than what's on the physical copy.",
      guidance: "Treat as high priority. Acknowledge this is a serious data issue. Confirm you are escalating to the production team immediately. Provide a 48-hour resolution timeline."
    },
    {
      category: "Printing & Quality",
      query: "I received my author copies and the print quality is terrible. The images are blurry and pages are misaligned.",
      guidance: "Apologise sincerely. Ask the author to share photos of the defective copies. Confirm that BookLeaf will arrange a free reprint once verified. Provide a timeline of 5–7 business days for the reprint."
    },
    {
      category: "Distribution & Availability",
      query: "My book is published but it's showing as 'Currently Unavailable' on Amazon.",
      guidance: "Explain that this is typically a stock sync issue. Confirm you're triggering a re-sync with the distribution team. Set expectation: 24–48 hours for it to go live again."
    },
    {
      category: "Book Status & Production Updates",
      query: "It's been 3 weeks and my book is still in typesetting. When will it be done?",
      guidance: "Check the actual production status. If it's delayed, be honest about why (e.g., waiting on author approval for proofs). Provide a specific updated timeline. Don't blame the author even if the delay is on their side—frame it collaboratively."
    },
    {
      category: "General Inquiry",
      query: "Can I update the description of my book on Amazon after it's already live?",
      guidance: "Yes, metadata updates can be submitted through the dashboard or by emailing the BookLeaf team. Changes typically reflect on platforms within 3–5 business days."
    }
  ]
};

const CATEGORIES = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry"
];

const PRIORITIES = ["Critical", "High", "Medium", "Low"];

module.exports = {
  BOOKLEAF_KNOWLEDGE_BASE,
  CATEGORIES,
  PRIORITIES
};
