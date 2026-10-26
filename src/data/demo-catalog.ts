// Demo catalogue — every provider, service and review here is fictional and
// is stored with isDemo=true so the UI labels it as a simulated listing.
// [durationMinutes, priceMinor, usageLimit | null]
type PlanTuple = [number, number, number | null];

export type DemoCategory = { slug: string; name: string; tagline: string; icon: string; accent: string };
export type DemoSeller = { key: string; name: string; bio: string; verified: boolean; website: string; authKind: "OWN_SERVICE" | "OFFICIAL_API" | "RESELLER_AGREEMENT" | "CONTENT_LICENSE"; authTitle: string };
export type DemoService = {
  slug: string;
  name: string;
  seller: string;
  category: string;
  tagline: string;
  description: string;
  features: string[];
  tags: string[];
  icon: string;
  accent: string;
  accessMethod: "OFFICIAL_API" | "OAUTH" | "PROVIDER_TOKEN" | "MANAGED_SERVICE" | "DEMO";
  usageUnit: string;
  plans: PlanTuple[];
  featured?: boolean;
  capacity?: number;
  popularity: number;
};

export const DEMO_CATEGORIES: DemoCategory[] = [
  { slug: "ai-studio", name: "AI Studio", tagline: "Assistants, research agents and voice", icon: "sparkles", accent: "#d4af6a" },
  { slug: "video-creative", name: "Video & Creative", tagline: "Image, video and design generation", icon: "clapperboard", accent: "#a78bfa" },
  { slug: "productivity", name: "Productivity", tagline: "Coding copilots, writing and automation", icon: "code", accent: "#6ee7c8" },
  { slug: "entertainment", name: "Entertainment", tagline: "Licensed channels and streaming passes", icon: "tv", accent: "#f2937e" },
  { slug: "creator-services", name: "Creator Services", tagline: "Channel growth, editing and management", icon: "megaphone", accent: "#f5c26b" },
  { slug: "business-tools", name: "Business Tools", tagline: "Analytics, CRM and operations software", icon: "briefcase", accent: "#8fb3ff" },
];

export const DEMO_SELLERS: DemoSeller[] = [
  { key: "lumen", name: "Lumen Labs", bio: "Applied AI studio building assistants and research agents on its own models.", verified: true, website: "https://lumen.example", authKind: "OWN_SERVICE", authTitle: "First-party service ownership" },
  { key: "aurora", name: "Aurora Collective", bio: "Generative imaging and motion tools built for studios and agencies.", verified: true, website: "https://aurora.example", authKind: "OWN_SERVICE", authTitle: "First-party service ownership" },
  { key: "northwind", name: "Northwind Software", bio: "Developer and business productivity software with metered API access.", verified: true, website: "https://northwind.example", authKind: "OFFICIAL_API", authTitle: "Official API partner programme" },
  { key: "meridian", name: "Meridian Broadcast", bio: "Licensed distributor of live sports and documentary channels in India.", verified: true, website: "https://meridian.example", authKind: "CONTENT_LICENSE", authTitle: "Regional content distribution licence" },
  { key: "crescendo", name: "Crescendo Creator Co.", bio: "A team of editors, strategists and analysts serving YouTube creators.", verified: true, website: "https://crescendo.example", authKind: "OWN_SERVICE", authTitle: "Managed creator services" },
  { key: "halcyon", name: "Halcyon Audio", bio: "Voice synthesis and audio clean-up tools for podcasters.", verified: false, website: "https://halcyon.example", authKind: "RESELLER_AGREEMENT", authTitle: "Authorised reseller agreement" },
];

const H = 60, H3 = 180, H6 = 360, D = 1440, W = 10080, M = 43200, Y = 525600;

export const DEMO_SERVICES: DemoService[] = [
  // ── AI Studio
  {
    slug: "lumen-assistant-pro", name: "Lumen Assistant Pro", seller: "lumen", category: "ai-studio",
    tagline: "A long-context AI assistant for research, drafting and analysis.",
    description: "Lumen Assistant Pro pairs a long-context reasoning model with document upload, citations and a private workspace. Rent it for a focused research sprint or keep it monthly as your daily thinking partner. Access is provisioned through Lumen's own API — no shared accounts.",
    features: ["200-page document uploads", "Cited answers", "Private workspace per rental", "Export to Markdown & PDF"],
    tags: ["assistant", "research", "writing", "ai"], icon: "bot", accent: "#d4af6a", accessMethod: "OFFICIAL_API", usageUnit: "messages",
    plans: [[H, 4900, 60], [H6, 19900, 300], [D, 34900, 800], [M, 99900, null], [Y, 999900, null]], featured: true, popularity: 980,
  },
  {
    slug: "lumen-research-agent", name: "Lumen Research Agent", seller: "lumen", category: "ai-studio",
    tagline: "Autonomous web research that returns a sourced brief in minutes.",
    description: "Give the agent a question and it plans, browses, reads and synthesises a structured brief with every claim linked to a source. Ideal for market scans, literature reviews and due diligence.",
    features: ["Multi-step browsing", "Source-linked briefs", "Competitor scans", "Shareable reports"],
    tags: ["agent", "research", "ai"], icon: "search", accent: "#e3c58c", accessMethod: "OFFICIAL_API", usageUnit: "research runs",
    plans: [[H3, 14900, 10], [D, 39900, 40], [W, 129900, 150], [M, 349900, 600]], popularity: 640,
  },
  {
    slug: "halcyon-voice-studio", name: "Halcyon Voice Studio", seller: "halcyon", category: "ai-studio",
    tagline: "Natural voice-overs in 30 Indian and global languages.",
    description: "Turn scripts into broadcast-quality narration with expressive, licensed voices. Includes pronunciation controls, SSML, and commercial-use rights for content created during your rental.",
    features: ["30 languages incl. Hindi, Tamil, Bengali", "Commercial-use licence", "SSML & pronunciation", "WAV & MP3 export"],
    tags: ["voice", "audio", "tts", "ai"], icon: "mic", accent: "#c9b6ff", accessMethod: "PROVIDER_TOKEN", usageUnit: "audio minutes",
    plans: [[H, 3900, 15], [D, 24900, 120], [W, 89900, 600], [M, 199900, 2000]], popularity: 520,
  },
  {
    slug: "halcyon-podcast-cleanup", name: "Halcyon Podcast Clean-up", seller: "halcyon", category: "ai-studio",
    tagline: "Remove noise, echo and filler words from recorded audio.",
    description: "Upload raw recordings and receive studio-clean audio with levelled loudness, de-reverb and optional filler-word removal. Built for podcasters and course creators.",
    features: ["Noise & echo removal", "Loudness normalisation", "Filler-word removal", "Batch processing"],
    tags: ["audio", "podcast", "ai"], icon: "audio-lines", accent: "#b9a4f5", accessMethod: "PROVIDER_TOKEN", usageUnit: "audio minutes",
    plans: [[H3, 9900, 90], [D, 19900, 240], [M, 149900, 2400]], popularity: 310,
  },
  // ── Video & Creative
  {
    slug: "aurora-image-studio", name: "Aurora Image Studio", seller: "aurora", category: "video-creative",
    tagline: "Photoreal and illustrative image generation with brand styles.",
    description: "Generate campaign-ready imagery from prompts or reference photos. Save brand style presets, upscale to print resolution and keep full commercial rights to outputs created during your rental.",
    features: ["4K upscaling", "Brand style presets", "Reference-image control", "Commercial rights"],
    tags: ["image", "design", "generative", "ai"], icon: "image", accent: "#a78bfa", accessMethod: "OFFICIAL_API", usageUnit: "generations",
    plans: [[H, 5900, 40], [H6, 24900, 200], [D, 39900, 400], [M, 179900, 4000]], featured: true, popularity: 910,
  },
  {
    slug: "aurora-motion", name: "Aurora Motion", seller: "aurora", category: "video-creative",
    tagline: "Text-to-video and image-to-video clips up to 20 seconds.",
    description: "Create cinematic B-roll, product shots and social clips from text or a still image. Camera controls, consistent characters and 1080p output. GPU capacity is limited, so availability is shown live.",
    features: ["1080p output", "Camera path controls", "Character consistency", "Up to 20s per clip"],
    tags: ["video", "generative", "ai"], icon: "clapperboard", accent: "#8b5cf6", accessMethod: "OFFICIAL_API", usageUnit: "clips",
    plans: [[H, 9900, 6], [H3, 24900, 18], [D, 69900, 60], [W, 299900, 300]], featured: true, capacity: 40, popularity: 870,
  },
  {
    slug: "aurora-brand-kit", name: "Aurora Brand Kit Generator", seller: "aurora", category: "video-creative",
    tagline: "Logos, palettes and social templates generated in one session.",
    description: "Describe your business and receive a starter identity — logo concepts, colour palette, typography pairings and editable social templates — ready to refine.",
    features: ["Logo concepts", "Palette & type pairing", "Editable templates", "SVG export"],
    tags: ["branding", "design", "ai"], icon: "palette", accent: "#c4b5fd", accessMethod: "OFFICIAL_API", usageUnit: "kits",
    plans: [[H3, 19900, 3], [D, 44900, 10], [M, 249900, 60]], popularity: 450,
  },
  {
    slug: "crescendo-thumbnail-lab", name: "Thumbnail Lab", seller: "crescendo", category: "video-creative",
    tagline: "AI-assisted thumbnails reviewed by a human designer.",
    description: "Generate thumbnail variations from your video frame, then get a human designer's polish on your favourite. A/B test-ready exports included.",
    features: ["10 AI variations per video", "Designer polish", "A/B test exports", "48h turnaround"],
    tags: ["youtube", "thumbnail", "design"], icon: "wand", accent: "#ddd6fe", accessMethod: "MANAGED_SERVICE", usageUnit: "thumbnails",
    plans: [[W, 149900, 5], [M, 449900, 20]], popularity: 380,
  },
  // ── Productivity
  {
    slug: "northwind-code-copilot", name: "Northwind Code Copilot", seller: "northwind", category: "productivity",
    tagline: "An AI pair programmer for your editor and terminal.",
    description: "Inline completions, chat over your repository, test generation and refactors. Connect through Northwind's official OAuth integration — your code never leaves the sandboxed session.",
    features: ["Editor & terminal plugins", "Repository-aware chat", "Test generation", "SOC 2 Type II (provider)"],
    tags: ["coding", "developer", "ai"], icon: "code", accent: "#6ee7c8", accessMethod: "OAUTH", usageUnit: "requests",
    plans: [[H3, 7900, 300], [D, 19900, 1500], [W, 79900, 8000], [M, 189900, null], [Y, 1899900, null]], featured: true, popularity: 940,
  },
  {
    slug: "northwind-docs-ai", name: "Northwind Docs AI", seller: "northwind", category: "productivity",
    tagline: "Draft, summarise and translate documents with your team's tone.",
    description: "A writing workspace that learns your style guide, summarises long PDFs and translates between 25 languages while keeping formatting intact.",
    features: ["Style-guide learning", "PDF summaries", "25-language translation", "Track changes"],
    tags: ["writing", "documents", "ai"], icon: "file-text", accent: "#5eead4", accessMethod: "OAUTH", usageUnit: "documents",
    plans: [[D, 14900, 40], [W, 49900, 200], [M, 129900, 1000]], popularity: 560,
  },
  {
    slug: "northwind-automate", name: "Northwind Automate", seller: "northwind", category: "productivity",
    tagline: "No-code workflows connecting 400+ apps with AI steps.",
    description: "Build automations visually, add AI classification or extraction steps, and run them on Northwind's infrastructure. Rent it for a migration weekend or keep it monthly.",
    features: ["400+ app connectors", "AI extraction steps", "Run history & retries", "Team sharing"],
    tags: ["automation", "workflow", "no-code"], icon: "workflow", accent: "#99f6e4", accessMethod: "OAUTH", usageUnit: "task runs",
    plans: [[D, 9900, 1000], [W, 39900, 10000], [M, 99900, 50000]], popularity: 430,
  },
  {
    slug: "lumen-meeting-notes", name: "Lumen Meeting Notes", seller: "lumen", category: "productivity",
    tagline: "Transcripts, decisions and action items from every call.",
    description: "Connect your calendar and receive accurate transcripts, summaries and owner-assigned action items within minutes of each meeting ending.",
    features: ["Speaker labels", "Action-item extraction", "Calendar integration", "Searchable archive"],
    tags: ["meetings", "transcription", "ai"], icon: "notebook", accent: "#7dd3c0", accessMethod: "OAUTH", usageUnit: "meeting hours",
    plans: [[W, 29900, 10], [M, 79900, 50], [Y, 799900, 700]], popularity: 390,
  },
  // ── Entertainment (licensed)
  {
    slug: "meridian-sports-live", name: "Meridian Sports Live", seller: "meridian", category: "entertainment",
    tagline: "Licensed live cricket, football and kabaddi channels.",
    description: "Stream Meridian's licensed sports channels in HD on up to two devices. Day passes are perfect for a big match; monthly passes cover the season. Streams are delivered by Meridian's authorised player with DRM.",
    features: ["HD live streams", "2 devices", "Match replays for 48h", "Authorised DRM player"],
    tags: ["sports", "live tv", "cricket", "streaming"], icon: "tv", accent: "#f2937e", accessMethod: "PROVIDER_TOKEN", usageUnit: "streams",
    plans: [[H6, 4900, null], [D, 7900, null], [W, 29900, null], [M, 79900, null]], featured: true, capacity: 5000, popularity: 990,
  },
  {
    slug: "meridian-documentary-pass", name: "Meridian Documentary Pass", seller: "meridian", category: "entertainment",
    tagline: "Award-winning documentaries and nature series on demand.",
    description: "A curated, licensed library of 600+ documentaries across nature, science and history, in English and Hindi. Download for offline viewing in the authorised app.",
    features: ["600+ titles", "English & Hindi audio", "Offline downloads", "4K on select titles"],
    tags: ["documentary", "streaming", "vod"], icon: "film", accent: "#fda4af", accessMethod: "PROVIDER_TOKEN", usageUnit: "streams",
    plans: [[D, 3900, null], [W, 14900, null], [M, 39900, null], [Y, 399900, null]], popularity: 610,
  },
  {
    slug: "meridian-kids-world", name: "Meridian Kids World", seller: "meridian", category: "entertainment",
    tagline: "Safe, ad-free animation and learning shows for children.",
    description: "Age-rated shows with parental controls, screen-time limits and no ads. Licensed for streaming in India.",
    features: ["Parental controls", "Screen-time limits", "Ad-free", "Learning playlists"],
    tags: ["kids", "streaming", "family"], icon: "baby", accent: "#fecaca", accessMethod: "PROVIDER_TOKEN", usageUnit: "streams",
    plans: [[W, 9900, null], [M, 24900, null], [Y, 249900, null]], popularity: 340,
  },
  {
    slug: "meridian-concert-hall", name: "Meridian Concert Hall", seller: "meridian", category: "entertainment",
    tagline: "Live-streamed classical and indie concerts, licensed per event.",
    description: "Tickets to licensed live-streamed concerts with multi-camera views and 72-hour replays.",
    features: ["Multi-camera views", "72h replay", "Hi-fi audio", "Artist Q&A sessions"],
    tags: ["music", "concerts", "live"], icon: "music", accent: "#fb7185", accessMethod: "PROVIDER_TOKEN", usageUnit: "streams",
    plans: [[H6, 14900, null], [D, 19900, null]], capacity: 2000, popularity: 280,
  },
  // ── Creator Services
  {
    slug: "crescendo-channel-management", name: "Channel Management", seller: "crescendo", category: "creator-services",
    tagline: "A dedicated manager for uploads, SEO and community.",
    description: "Crescendo's managers publish, optimise titles and descriptions, schedule Shorts and moderate comments — through YouTube's official delegated access (you grant a Manager role; we never ask for passwords).",
    features: ["Delegated access via official roles", "Title & tag optimisation", "Upload scheduling", "Weekly performance report"],
    tags: ["youtube", "management", "growth"], icon: "megaphone", accent: "#f5c26b", accessMethod: "MANAGED_SERVICE", usageUnit: "videos",
    plans: [[W, 249900, 4], [M, 799900, 16], [Y, 7999900, 200]], featured: true, popularity: 720,
  },
  {
    slug: "crescendo-video-editing", name: "Pro Video Editing", seller: "crescendo", category: "creator-services",
    tagline: "Human editors for long-form videos and Shorts.",
    description: "Send raw footage and receive a polished edit with captions, B-roll, sound design and colour. Includes two revision rounds per video.",
    features: ["Captions & B-roll", "Sound design", "Colour grading", "2 revisions"],
    tags: ["editing", "youtube", "shorts"], icon: "scissors", accent: "#fcd34d", accessMethod: "MANAGED_SERVICE", usageUnit: "videos",
    plans: [[W, 199900, 2], [M, 699900, 8]], popularity: 530,
  },
  {
    slug: "crescendo-growth-audit", name: "Channel Growth Audit", seller: "crescendo", category: "creator-services",
    tagline: "Data-driven audit of your channel with a 90-day plan.",
    description: "Our analysts review retention, CTR, packaging and competitors using YouTube Analytics data you share through official read-only access, then deliver a 90-day roadmap.",
    features: ["Retention analysis", "Packaging review", "Competitor benchmarks", "90-day roadmap"],
    tags: ["youtube", "analytics", "strategy"], icon: "trending-up", accent: "#fde68a", accessMethod: "MANAGED_SERVICE", usageUnit: "audits",
    plans: [[W, 299900, 1]], popularity: 260,
  },
  {
    slug: "aurora-shorts-studio", name: "Aurora Shorts Studio", seller: "aurora", category: "creator-services",
    tagline: "Turn long videos into captioned vertical Shorts automatically.",
    description: "Upload a long-form video and Aurora finds the strongest moments, reframes to 9:16, adds animated captions and suggests hooks.",
    features: ["Auto highlight detection", "9:16 reframing", "Animated captions", "Hook suggestions"],
    tags: ["shorts", "reels", "video", "ai"], icon: "smartphone", accent: "#fbbf24", accessMethod: "OFFICIAL_API", usageUnit: "source videos",
    plans: [[D, 14900, 3], [W, 59900, 15], [M, 149900, 60]], popularity: 670,
  },
  // ── Business Tools
  {
    slug: "northwind-insights", name: "Northwind Insights", seller: "northwind", category: "business-tools",
    tagline: "Ask questions of your business data in plain language.",
    description: "Connect a spreadsheet or database and ask questions in plain English. Insights writes the query, charts the answer and explains its reasoning.",
    features: ["Natural-language queries", "Auto charts", "Scheduled reports", "Read-only connectors"],
    tags: ["analytics", "bi", "data", "ai"], icon: "chart", accent: "#8fb3ff", accessMethod: "OAUTH", usageUnit: "queries",
    plans: [[D, 19900, 200], [W, 69900, 1000], [M, 179900, 5000]], featured: true, popularity: 600,
  },
  {
    slug: "northwind-crm-lite", name: "Northwind CRM Lite", seller: "northwind", category: "business-tools",
    tagline: "A clean CRM for small teams with AI follow-up drafts.",
    description: "Pipeline boards, email logging and AI-drafted follow-ups. Rent seats for a sales sprint or event season and export everything when you're done.",
    features: ["Pipeline boards", "Email logging", "AI follow-up drafts", "CSV export anytime"],
    tags: ["crm", "sales", "smb"], icon: "users", accent: "#93c5fd", accessMethod: "OAUTH", usageUnit: "contacts",
    plans: [[W, 19900, 500], [M, 59900, 5000], [Y, 599900, null]], popularity: 350,
  },
  {
    slug: "lumen-support-agent", name: "Lumen Support Agent", seller: "lumen", category: "business-tools",
    tagline: "An AI agent that answers customer tickets from your docs.",
    description: "Train an agent on your help centre and let it draft or send replies on email and chat, with human hand-off rules you control.",
    features: ["Trains on your docs", "Email & chat channels", "Human hand-off rules", "CSAT tracking"],
    tags: ["support", "agent", "ai"], icon: "headset", accent: "#a5b4fc", accessMethod: "OFFICIAL_API", usageUnit: "conversations",
    plans: [[W, 99900, 500], [M, 299900, 3000]], popularity: 410,
  },
  {
    slug: "northwind-invoice-ai", name: "Northwind Invoice AI", seller: "northwind", category: "business-tools",
    tagline: "Extract, reconcile and export invoice data, GST-ready.",
    description: "Drop in invoices and receipts; get structured, GST-compliant line items reconciled against your ledger and exported to your accounting software.",
    features: ["GST-aware extraction", "Ledger reconciliation", "Tally & Zoho exports", "Audit trail"],
    tags: ["finance", "invoices", "gst"], icon: "receipt", accent: "#bfdbfe", accessMethod: "OAUTH", usageUnit: "documents",
    plans: [[D, 9900, 100], [M, 99900, 2000]], popularity: 300,
  },
];

const REVIEW_AUTHORS = ["Ananya R.", "Karthik S.", "Meera P.", "Rohan D.", "Fatima K.", "Vikram N.", "Isha G.", "Arjun M.", "Sneha T.", "Dev A."];
const REVIEW_TEMPLATES: [number, string, string][] = [
  [5, "Exactly what I needed for one project", "Renting for a day instead of committing to a full subscription saved me money, and access started the moment I paid."],
  [5, "Smooth from checkout to expiry", "The countdown is clear, renewal took two taps, and I got a reminder before it ended."],
  [4, "Great value for short sprints", "Quality is excellent. I'd love a 12-hour option, but the 6-hour plan worked well."],
  [4, "Reliable and well documented", "Setup was quick and the provider responded to my question within an hour."],
  [5, "Now my go-to way to try tools", "I test new tools here before buying annual plans. Transparent pricing and no surprises."],
  [3, "Good, with a learning curve", "Powerful once you get used to it. Usage limits were clearly shown, which I appreciated."],
];

export function demoReviewsFor(index: number) {
  const count = 2 + (index % 3);
  return Array.from({ length: count }, (_, i) => {
    const [rating, title, body] = REVIEW_TEMPLATES[(index + i * 2) % REVIEW_TEMPLATES.length]!;
    return { authorName: REVIEW_AUTHORS[(index * 3 + i) % REVIEW_AUTHORS.length]!, rating, title, body, daysAgo: 3 + ((index * 7 + i * 11) % 60) };
  });
}
