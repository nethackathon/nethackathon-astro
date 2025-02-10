import type { EventDto } from '../dto/event.dto';
import type { NHEvent } from '../types/NHEvent';

export declare function eventDateString(start: string | number | Date, end: string | number | Date): string;
export declare function parseEvent(event: EventDto): NHEvent;
