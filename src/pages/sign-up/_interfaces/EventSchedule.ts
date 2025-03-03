export interface ScheduleSlot {
  username: string;
  start_time: string;
  end_time: string;
  notes: string;
}

export interface EventSchedule {
  schedule: ScheduleSlot[];
}
