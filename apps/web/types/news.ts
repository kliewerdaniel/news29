export interface Broadcast {
  broadcast_id: string;
  title: string;
  created_at: string;
  segments: {
    title: string;
    summary: string;
    audio_url: string;
    persona_comments?: Record<string, string>;
  }[];
}
