import Streamers from '../../../components/Streamers.astro';
import type { ScheduleSlot } from '../_interfaces/EventSchedule';
import type { StreamerSchedule } from '../_interfaces/StreamerSchedules';
import { DateTime, Duration, Interval } from 'luxon';
import { ref, computed, watch, type Ref } from 'vue';

export function useSchedule(
  eventStartTime: Ref<string>,
  eventEndTime: Ref<string>,
  streamerAvailability: Ref<StreamerSchedule[]>,
  initialScheduledSlots: Ref<ScheduleSlot[]>,
  selectedTimezone: Ref<string>
) {

  interface Streamer {
    username: string;
    preference: number;
    slotLength: number;
  }

  function deepClone<T>(obj: T): T {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (e) {
      console.error('Error cloning object:', e);
      return obj;
    }
  }

  const scheduledSlots = ref<ScheduleSlot[]>(
    initialScheduledSlots.value?.length ? deepClone(initialScheduledSlots.value) : []
  );

  const modified = computed(() => {
    if (scheduledSlots.value.length !== initialScheduledSlots.value.length) {
      return true;
    }
    const sortedCurrent = [...scheduledSlots.value].sort((a, b) =>
      a.start_time.localeCompare(b.start_time) || a.username.localeCompare(b.username)
    );

    const sortedOriginal = [...initialScheduledSlots.value].sort((a, b) =>
      a.start_time.localeCompare(b.start_time) || a.username.localeCompare(b.username)
    );

    const currentStr = JSON.stringify(sortedCurrent);
    const originalStr = JSON.stringify(sortedOriginal);

    return currentStr !== originalStr;
  });

  watch(initialScheduledSlots, (newSlots) => {
    scheduledSlots.value = deepClone(newSlots);
  }, { deep: true });

  const startDate = computed(() => DateTime.fromISO(eventStartTime.value, { zone: 'utc' }));
  const endDate = computed(() => DateTime.fromISO(eventEndTime.value, { zone: 'utc' }));

  const timeSlots = computed(() => {
    if (!startDate.value || !endDate.value) return [];
    return Interval.fromDateTimes(startDate.value, endDate.value)
      .splitBy({ minutes: 30 });
  });

  const days = computed(() => {
    if (!startDate.value || !endDate.value) return [];

    const localStartDate = startDate.value.setZone(selectedTimezone.value);
    const localEndDate = endDate.value.setZone(selectedTimezone.value);

    const startOfFirstDay = localStartDate.startOf('day');
    const endOfLastDay = localEndDate.endOf('day');

    const dayIntervals = [];

    let currentDay = startOfFirstDay;
    while (currentDay < endOfLastDay) {
      const nextDay = currentDay.plus({ days: 1 }).startOf('day');

      const intervalStart = DateTime.max(
        currentDay,
        localStartDate
      ).setZone('utc');

      const intervalEnd = DateTime.min(
        nextDay,
        localEndDate
      ).setZone('utc');

      const dayInterval = Interval.fromDateTimes(intervalStart, intervalEnd);
      dayIntervals.push(dayInterval);

      currentDay = nextDay;
    }

    return dayIntervals;
  });

  const schedule = computed(() => {
    const result = days.value.map(day => {
      const daySlots = slotsOnDay(day);
      return {
        day,
        formattedDay: formattedDay(day),
        slots: daySlots.map(slot => {
          const scheduled = scheduledForSlot(slot);
          return {
            slot,
            timeRange: `${formattedTime(slot.start)} - ${formattedTime(slot.end)}`,
            availableStreamers: availableStreamersForSlot(slot),
            scheduledStreamer: scheduled.length > 0 ? scheduled[0] : null,
            isFirstSlotForStreamer: isFirstSlotForUser(slot)
          };
        })
      };
    });
    return result;
  });

  const mergedSchedule: Ref<ScheduleSlot[]> = computed(() => {
    const collapsedSchedule = JSON.parse(JSON.stringify(scheduledSlots.value));

    let mergeOperation;
    while (mergeOperation = findMergeableSlots(collapsedSchedule)) {
      const { slot1, slot2 } = mergeOperation;
      slot1.end_time = slot2.end_time;
      if (!slot1.notes && slot2.notes) {
        slot1.notes = slot2.notes;
      }
      const index = collapsedSchedule.indexOf(slot2);
      collapsedSchedule.splice(index, 1);
    }

    return collapsedSchedule;
  });

  const scheduleIssues = computed(() => {
    const issues: string[] = [];

    const scheduledMoreThanOnce = mergedSchedule.value
      .filter(
        (slot, index, arr) => arr.findIndex(s => s.username === slot.username) !== index
      )
      .map(slot => slot.username)
      .filter((username, index, arr) => arr.indexOf(username) === index);

    if (scheduledMoreThanOnce.length > 0) {
      issues.push(`${scheduledMoreThanOnce.length} streamers scheduled more than once: ${scheduledMoreThanOnce.join(', ')}`);
    }

    const scheduledTooLong = mergedSchedule.value
      .filter(slot => {
        const slotLength = Interval.fromDateTimes(DateTime.fromISO(slot.start_time), DateTime.fromISO(slot.end_time))
          .toDuration('minutes').toMillis();
        const streamerSchedule = streamerAvailability.value.find(s => s.username === slot.username);
        if (!streamerSchedule) return false;
        const streamerSlotLength = streamerSchedule.slot_length === '3 hours' ? 3 : streamerSchedule.slot_length === '4 hours' ? 4 : 2;
        return slotLength > streamerSlotLength * 60 * 60 * 1000;
      })
      .map(slot => slot.username);

    if (scheduledTooLong.length > 0) {
      issues.push(`${scheduledTooLong.length} streamers scheduled for too long: ${scheduledTooLong.join(', ')}`);
    }

    const scheduledWhenUnavailable = mergedSchedule.value
      .filter(slot => {
        const fullSlot = Interval.fromDateTimes(DateTime.fromISO(slot.start_time), DateTime.fromISO(slot.end_time));
        const subSlots = fullSlot.splitBy({ minutes: 30 });
        const streamerAvailableForFullSlot = subSlots.every(subSlot => availableStreamersForSlot(subSlot).some(s => s.username === slot.username));
        return !streamerAvailableForFullSlot;
      })
      .map(slot => slot.username)
      .filter((username, index, arr) => arr.indexOf(username) === index);

    if (scheduledWhenUnavailable.length > 0) {
      issues.push(`${scheduledWhenUnavailable.length} streamers scheduled when unavailable: ${scheduledWhenUnavailable.join(', ')}`);
    }

    const unscheduledStreamers = streamerAvailability.value
      .filter(streamer => !mergedSchedule.value.some(slot => slot.username === streamer.username))
      .map(streamer => streamer.username);

    if (unscheduledStreamers.length > 0) {
      issues.push(`${unscheduledStreamers.length} streamers not scheduled: ${unscheduledStreamers.join(', ')}`);
    }

    return issues;
  });

  function formattedDay(day: Interval) {
    if (!day.start) return '';

    const localDate = day.start.setZone(selectedTimezone.value);
    return localDate.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);
  }

  function formattedTime(dateTime: DateTime | null) {
    if (!dateTime) return '';

    const localTime = dateTime.setZone(selectedTimezone.value);
    return localTime.toLocaleString(DateTime.TIME_SIMPLE);
  }

  function slotsOnDay(day: Interval): Interval[] {
    return timeSlots.value.filter(slot => day.overlaps(slot));
  }

  function availableStreamersForSlot(slot: Interval): Streamer[] {
    return streamerAvailability.value.map((streamerSchedule: StreamerSchedule) => {
      const slotLength = streamerSchedule.slot_length === '3 hours' ? 3 : streamerSchedule.slot_length === '4 hours' ? 4 : 2;
      for (const [timestamp, preference] of Object.entries(streamerSchedule.schedule)) {
        if (preference > 0 && slot.contains(DateTime.fromMillis(parseInt(timestamp)))) {
          return { username: streamerSchedule.username, preference, slotLength };
        }
      }
      return { username: streamerSchedule.username, preference: 0, slotLength };
    }).filter(s => s.preference > 0);
  }

  function scheduledForSlot(slot: Interval): ScheduleSlot[] {
    return scheduledSlots.value.filter((scheduleSlot: ScheduleSlot) => {
      return slot.overlaps(Interval.fromDateTimes(
        DateTime.fromISO(scheduleSlot.start_time),
        DateTime.fromISO(scheduleSlot.end_time)
      ));
    });
  }

  function isFirstSlotForUser(slot: Interval): boolean {
    const scheduled = scheduledForSlot(slot);
    if (scheduled.length === 0) return false;

    const slotIndex = timeSlots.value.findIndex(s =>
      s.start && slot.start && s.start.equals(slot.start));

    if (slotIndex <= 0) return true;

    const previousSlot = timeSlots.value[slotIndex - 1];
    const previousScheduled = scheduledForSlot(previousSlot);

    return previousScheduled.length === 0 ||
      previousScheduled[0].username !== scheduled[0].username;
  }

  function findMergeableSlots(slots: ScheduleSlot[]): { slot1: ScheduleSlot, slot2: ScheduleSlot } | null {
    for (const slot1 of slots) {
      const slot2 = slots.find(s =>
        s !== slot1 &&
        s.username === slot1.username &&
        s.start_time === slot1.end_time
      );
      if (slot2) {
        return { slot1, slot2 };
      }
    }
    return null;
  }

  function scheduleStreamer(streamer: string, slot: Interval) {
    const existingScheduledSlots = scheduledForSlot(slot);

    if (existingScheduledSlots.length > 0) {
      for (const existingSlot of existingScheduledSlots) {
        existingSlot.username = streamer;
        existingSlot.notes = '';
      }
    } else {
      const newScheduledSlot: ScheduleSlot = {
        username: streamer,
        start_time: slot.start?.toISO() || '',
        end_time: slot.end?.toISO() || '',
        notes: ''
      };

      scheduledSlots.value.push(newScheduledSlot);
    }
  }

  function unscheduleStreamer(slot: Interval) {
    const slotsToRemove = scheduledForSlot(slot);

    scheduledSlots.value = scheduledSlots.value.filter(s =>
      !slotsToRemove.includes(s)
    );
  }

  function updateNotes(slot: Interval, notes: string) {
    const matchingSlots = scheduledForSlot(slot);

    if (matchingSlots.length === 0) {
      console.error('No matching slot found to update notes');
      return;
    }
    const scheduledSlot = matchingSlots[0];
    scheduledSlot.notes = notes;
    scheduledSlots.value = [...scheduledSlots.value];
  }

  function saveSchedule() {
    scheduledSlots.value = deepClone(mergedSchedule.value);
    return mergedSchedule.value;
  }

  function updateFullSchedule(newSchedule: ScheduleSlot[]) {
    scheduledSlots.value = deepClone(newSchedule);
  }

  return {
    scheduledSlots,
    modified,
    schedule,
    mergedSchedule,
    scheduleStreamer,
    unscheduleStreamer,
    updateNotes,
    saveSchedule,
    updateFullSchedule,
    scheduleIssues
  };
} 