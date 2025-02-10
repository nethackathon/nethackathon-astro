<script setup lang="ts">
  import { computed, ref, onMounted } from 'vue';
  import { DateTime, Interval } from 'luxon';
  import SignUpSaveState from "./_SignUpSaveState.vue";

  const emit = defineEmits(['scheduleSlot']);

  const props = defineProps<({
    startDate: string,
    endDate: string,
    schedule: object,
    saveState: number,
  })>();

  const slots = ref();

  onMounted(() => {
    const startDate = DateTime.fromISO(props.startDate).toLocal();
    const endDate = DateTime.fromISO(props.endDate).toLocal();
    slots.value = Interval.fromDateTimes(
      DateTime.fromObject({year: startDate.year, month: startDate.month, day: startDate.day, hour: startDate.hour}),
      DateTime.fromObject({year: endDate.year, month: endDate.month, day: endDate.day, hour: endDate.hour}))
        .splitBy({minutes: 30});
  });

  const slotsWithSchedule = computed(() => {
    if (slots.value === undefined) return [];
    return slots.value.map((s) => {
      s.available = (Object.prototype.hasOwnProperty.call(props.schedule, s.start.ts)) ? props.schedule[s.start.ts] : 0;
      return s;
    });
  });

  const localTimeZone = computed(() => {
    return DateTime.local().offsetNameShort;
  });

  const daysInLocal = computed(() => {
    const startDate = DateTime.fromISO(props.startDate).toLocal();
    const endDate = DateTime.fromISO(props.endDate).toLocal();
    let dayIntervals = Interval.fromDateTimes(
        DateTime.fromObject({year: startDate.year, month: startDate.month, day: startDate.day}),
        DateTime.fromObject({year: endDate.year, month: endDate.month, day: endDate.day + 1}))
        .splitBy({days: 1});
    return dayIntervals;
  });

  const makeAvailable = (s, evt) => {
    if (evt.buttons === 1) {
      emit('scheduleSlot', s);
      evt.preventDefault();
    }
  };

  const formattedDay = (day) => {
    return day.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);
  };

  const formattedStart = (start) => {
    return DateTime.fromISO(start).toLocaleString(DateTime.TIME_SIMPLE).padStart(8, '\u00A0');
  };

  const slotsOnDay = (d) => {
    if (slots.value === undefined) return [];
    return slotsWithSchedule.value.filter(s => d.contains(DateTime.fromISO(s.start).toLocal()));
  };
</script>

<template>
  <section class="c double">
    <SignUpSaveState :saveState="props.saveState" />
    <h1>Availability <small>(All times {{localTimeZone}})</small></h1>
    <p>Please mark ALL times that you are available. If you mark all the times
      you are available, we'll have a better chance of fitting you in the schedule.</p>
    <p>Click preferred time slots a 2nd time to star. We'll do our best to schedule you in preferred time slots first.</p>
    <p>You are only committing to <em>one time slot</em> during the weekend respecting your available time and maximum
      slot length. A preferred slot length of 3 or 4 hours does not guarantee a longer time slot; we only schedule
      time slots longer than two hours when required to fill the schedule.</p>
    <p>Click, tap, or click-and-drag to mark or unmark time slots.</p>
    <p>Availabilities are saved automatically, you can change your options at any time while sign-ups are open.</p>
    <table class="schedule-table">
      <thead>
        <tr>
          <th class="text-left">
          </th>
          <th class="text-left">
            Date
          </th>
          <th class="text-left">
            Click if available
          </th>
        </tr>
      </thead>
      <tbody v-for="day in daysInLocal" :key="day.start.toMillis()">
        <tr>
          <td colspan="4" class="dateHeader">{{formattedDay(day.start)}}</td>
        </tr>
        <tr
          :class="{streaming: (s.available === 1), preferred: (s.available === 2)}"
          @pointerover="makeAvailable(s, $event)"
          @pointerdown="makeAvailable(s, $event)"
          v-for="s in slotsOnDay(day)"
          :key="s.start.toMillis()">
          <td>&nbsp;</td>
          <td class="time-slot">{{ formattedStart(s.start) }} - {{ formattedStart(s.end) }}</td>
          <td class="availability" :class="{unavailable: s.available === 0}">
            {{ (s.available === 2) ? 'Preferred' : (s.available === 1) ? 'Available' : `I'm not available` }}
            <span v-if="s.available === 1">👍</span>
            <span v-if="s.available === 2">⭐</span>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
  table {
    border-collapse: collapse;
  }

  td {
    padding-left: 1rem;
    height: 3rem;
    cursor: pointer;
  }

  td.availability {
    text-align: center;
  }

  .save-state-message {
    float: right;
  }

  .schedule-table {
    width: 100%;
  }

  .streaming {
    background-color: rgba(234, 63, 247, 0.5) !important;
  }

  .preferred {
    background-color: rgba(234, 63, 247, 0.6) !important;
  }

  .dateHeader {
    background-color: rgba(148, 152, 248, 0.5);
    font-weight: bolder;
  }

  .unavailable {
    color: #656565;
  }
</style>
