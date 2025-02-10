export function isEventActive(event) {
  const now = new Date().toISOString();
  return (
    now > event.event_start &&
    now < event.event_end
  );
}

export function isEventUpcoming(event) {
  const now = new Date().toISOString();
  return now < event.event_start;
}

export function hasEventConcluded(event) {
  const now = new Date().toISOString();
  return now > event.event_end;
}

export function areSignupsActive(event) {
  const now = new Date().toISOString();
  return (
    now > event.signup_start &&
    now < event.signup_end
  );
}

export function areSignupsUpcoming(event) {
  const now = new Date().toISOString();
  return now < event.signup_start;
}

export function haveSignupsConcluded(event) {
  const now = new Date().toISOString();
  return now > event.signup_end;
}
