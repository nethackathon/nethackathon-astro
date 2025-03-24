export interface NHEvent {
  id?: number;
  title: string;
  signup_start: string;
  signup_end: string;
  event_start: string;
  event_end: string;
  streamer_count: number;
  editing: boolean;
  schedule_published: boolean;
  charity_name?: string;
  charity_description?: string;
  charity_url?: string;
  giving_url?: string;
  api_endpoint?: string;
}