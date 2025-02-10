import { DateTime } from 'luxon';

// Expects ISO string representation of event start and end
export function eventDateString(start, end) {
  const eventStart = new Date(start);
  const eventEnd = new Date(end);
  const options = { month: 'long', timeZone: 'UTC' };
  const startMonth = eventStart.toLocaleString('en-US', options);
  const endMonth = eventEnd.toLocaleString('en-US', options);
  return (startMonth === endMonth) ?
    `${startMonth} ${eventStart.getUTCDate()} - ${eventEnd.getUTCDate()}` :
    `${startMonth} ${eventStart.getUTCDate()} - ${endMonth} ${eventEnd.getUTCDate()}`;
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
    eventEnd: event.event_end,
    signupsStart: event.signup_start,
    signupsEnd: event.signup_end,
    beforeEvent,
    eventLive,
    signupsOpen,
    eventDates,
    eventStarting,
    eventTitle: event.title,
  };
}
