<script setup lang="ts">

import type { NHEvent } from './_interfaces/NHEvent';
import type { Participant } from './_services/participant.service';
import { computed } from 'vue';

const props = defineProps<({
  loading: boolean,
  selectedEvent: NHEvent | null,
  participants: Participant[],
})>();

const participantSorter = (a: Participant, b: Participant) => {
  return participantScore(b) - participantScore(a);
}

const participantScore = (participant: Participant) => {
  let score = participant.confirmed_time ? 20 : 0;
  score += participant.charity_selected ? 1 : 0;
  score += participant.checklist_progress;
  return score;
}


const sortedParticipants = computed(() => {
  return props.participants.sort(participantSorter);
});

</script>

<template>
  <section class="c double admin-events">
    <div class="header">
      <h2>Participants</h2>
    </div>

    <div v-if="props.loading">Loading participants...</div>
    <table v-else>
      <thead>
        <tr>
          <th>Username</th>
          <th>Discord Username</th>
          <th>Pronouns</th>
          <th>Schedule Length</th>
          <th>Slot Length</th>
          <th>Confirmed Time</th>
          <th>Charity Selected</th>
          <th>Checklist Progress</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="participant in sortedParticipants" :key="participant.username">
          <td>{{ participant.username }}</td>
          <td>{{ participant.discord_username }}</td>
          <td>{{ participant.pronouns }}</td>
          <td>{{ participant.schedule_length }}</td>
          <td>{{ participant.slot_length }}</td>
          <td>{{ participant.confirmed_time ? '✅' : '⬜' }}</td>
          <td>{{ participant.charity_selected ? '✅' : '⬜' }}</td>
          <td>{{ participant.checklist_progress }}</td>
          <td>{{ participant.notes }}</td>
        </tr> 
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.add-event {
  background-color: var(--color-b);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

html[data-theme="dark"] th {
  background-color: var(--color-dark-highlight);
}
html[data-theme="light"] th {
  background-color: var(--color-light-highlight);
}

html[data-theme="dark"] td {
  border-bottom: 1px solid var(--color-light);
}
html[data-theme="light"] td {
  border-bottom: 1px solid var(--color-dark);
}

th, td {
  padding: 0.5rem;
  text-align: left;
  font-size: 0.9rem;
}

th {
  font-weight: normal;
}
</style>