import { DateTime } from 'luxon';

// Expects ISO string representation of event start and end  
export function eventDateString(start, end) {
  const eventStart = new Date(start);
  const eventEnd = new Date(end);
  const fullMonth = { month: 'long' };
  const startMonth = eventStart.toLocaleString(undefined, fullMonth);
  const endMonth = eventEnd.toLocaleString(undefined, fullMonth);
  return (startMonth === endMonth) ? 
    `${startMonth} ${eventStart.getDate()} - ${eventEnd.getDate()}` :
    `${startMonth} ${eventStart.getDate()} - ${endMonth} ${eventEnd.getDate()}`; 
}


function getNumberSuffix(num) {
  if (num === 11 || num === 12 || num === 13) return 'th';

  const lastDigit = num.toString().slice(-1);

  switch (lastDigit) {
    case '1': return 'st';
    case '2': return 'nd';
    case '3': return 'rd';
    default: return 'th';
  }
}

export function parseEvent(event) {
  const now = new Date().toISOString();
  const beforeEvent = now < event.event_start;
  const eventLive = (
    now > event.event_start &&
    now < event.event_end
  );
  const signupsOpen = (
    now > event.signup_start &&
    now < event.signup_end
  );
  const eventDates = eventDateString(event.event_start, event.event_end);
  const eventStart = DateTime
    .fromISO(event.event_start, { zone: 'utc' });
  const eventStarting = eventStart
    .toFormat(`cccc, LLLL d'${getNumberSuffix(eventStart.day)}' 'at' h:mm a 'UTC'`);

  return {
    eventStart: event.event_start,
    signupsEnd: event.signup_end,
    beforeEvent,
    eventLive,
    signupsOpen,
    eventDates,
    eventStarting,
    eventTitle: event.title,
  };
}
