export interface Broadcast {
  broadcast_id: string;
  segments: {
    title: string;
    summary: string;
    audio_url: string;
  }[];
}
