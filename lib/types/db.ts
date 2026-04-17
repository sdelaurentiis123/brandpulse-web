export type SentimentLabel = "positive" | "negative" | "mixed" | "neutral";

export type ArticleSource = "Twitter" | "Reddit" | "TikTok" | "News";

export interface Profile {
  id: string;
  display_name: string | null;
  created_at: string;
}

export interface TrackedEntity {
  id: string;
  user_id: string;
  entity_name: string;
  display_name: string | null;
  entity_type: string | null;
  is_primary: boolean;
  aliases: string[] | null;
  created_at: string;
}

export interface Article {
  id: string;
  entity_name: string;
  source: ArticleSource | string;
  type: "post" | "narrative" | string;
  title: string | null;
  body: string | null;
  url: string | null;
  image_url: string | null;
  author_pic: string | null;
  sentiment: SentimentLabel | string | null;
  sentiment_score: number | null;
  reach: string | null;
  engagement: number | null;
  post_date: string | null;
  created_at: string;
}

export interface NarrativeThread {
  id: string;
  entity_name: string;
  thread_id: string;
  headline: string;
  status: "active" | "resolved" | string;
  first_seen: string;
  last_updated: string;
  sentiment: SentimentLabel | string | null;
}

export interface NarrativeUpdate {
  id: string;
  thread_id: string;
  entity_name: string;
  date: string;
  summary: string;
  sentiment: SentimentLabel | string | null;
  sentiment_score: number | null;
  sources: unknown;
  platforms_involved: string[] | null;
  evidence_quotes: unknown;
  created_at: string;
}

export interface NarrativeThreadWithUpdates extends NarrativeThread {
  updates: NarrativeUpdate[];
}

export interface ReputationSnapshot {
  id: string;
  entity_name: string;
  fetched_at: string;
  bpx: number | null;
  sentiment_index: number | null;
  momentum: number | null;
  authority_share: number | null;
  volatility: number | null;
  volume_total: number | null;
  volume_ratio: number | null;

  twitter_count: number | null;
  twitter_engagement: number | null;
  twitter_sentiment: number | null;
  reddit_count: number | null;
  reddit_engagement: number | null;
  reddit_sentiment: number | null;
  tiktok_count: number | null;
  tiktok_engagement: number | null;
  tiktok_sentiment: number | null;
  news_count: number | null;
  news_engagement: number | null;
  news_sentiment: number | null;

  narrative_count: number | null;
  narrative_new: number | null;
  narrative_evolving: number | null;
  narrative_fading: number | null;
  top_thread_id: string | null;
  top_thread_headline: string | null;
}

export interface ReportRow {
  id: string;
  entity_name: string;
  report_data: ReportData;
  created_at: string;
}

export interface ReportAction {
  title: string;
  reasoning?: string;
  sources?: string[];
  urls?: string[];
}

export interface ReportData {
  briefing?: string;
  overall?: {
    score?: number;
    sentiment?: string;
    delta?: number | string;
    social_volume?: number | string;
  };
  narratives?: Array<Record<string, unknown>>;
  actions?: Array<string | ReportAction>;
}

export interface ChatSession {
  id: string;
  user_id: string;
  entity_name: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}
