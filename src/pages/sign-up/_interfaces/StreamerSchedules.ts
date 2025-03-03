export interface ApiStreamerSchedules {
  streamers: ApiStreamerSchedule[];
}

export interface ApiStreamerSchedule {
  username: string;
  slot_length: '2 hours' | '3 hours' | '4 hours';
  schedule: string;
}

export interface StreamerSchedule {
  username: string;
  slot_length: '2 hours' | '3 hours' | '4 hours';
  schedule: Record<string, 0 | 1 | 2>;
}

export function convertApiStreamerSchedule(apiSchedule: ApiStreamerSchedule): StreamerSchedule {
  const schedule = JSON.parse(apiSchedule.schedule) as Record<string, 0 | 1 | 2>;
  return {
    username: apiSchedule.username,
    slot_length: apiSchedule.slot_length,
    schedule,
  };
}