<script setup lang="ts">

import type { NHEvent } from './_interfaces/NHEvent';
import { computed, ref } from 'vue';
import { formatDateTime } from './_utils/utils';

const props = defineProps<({
  nodeApi: String,
  events: NHEvent[],
  loading: boolean,
  selectedEvent: NHEvent | null,
})>();

const emit = defineEmits<{
  (e: 'update:events'): void
  (e: 'update:selected-event', event: NHEvent): void
}>();

const editingModel = ref<NHEvent | null>(null);

function addNewEvent() {
  const newEvent: NHEvent = {
    title: 'New Event',
    signup_start: formatDateTime(new Date()),
    signup_end: formatDateTime(new Date()),
    event_start: formatDateTime(new Date()),
    event_end: formatDateTime(new Date()),
    streamer_count: 0,
    editing: true,
    schedule_published: false,
  };
  props.events.push(newEvent);
  startEditing(props.events[props.events.length - 1]);
}

function stopEditing(selectedEvent: NHEvent) {
  selectedEvent.editing = false;
}

function startEditing(selectedEvent: NHEvent) {
  props.events.forEach(event => {
    event.editing = event === selectedEvent;
  });
  editingModel.value = { ...selectedEvent };
}

async function saveEvent(selectedEvent: NHEvent) {
  try {
    const url = `${props.nodeApi}/event`;
    await fetch(url, {
      method: (selectedEvent.id) ? 'PATCH' : 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...selectedEvent,
      }),
    });
  } catch (error) {
    console.error(error);
  } finally {
    emit('update:events');
  }
}

const isModified = computed(() => {
  if (!editingModel.value) return false;
  const currentEvent = props.events.find(e => e.editing);
  if (!currentEvent) return false;

  return (
    editingModel.value.title !== currentEvent.title ||
    editingModel.value.signup_start !== currentEvent.signup_start ||
    editingModel.value.signup_end !== currentEvent.signup_end ||
    editingModel.value.event_start !== currentEvent.event_start ||
    editingModel.value.event_end !== currentEvent.event_end
  );
});

</script>

<template>
  <section class="c double admin-events">
    <div class="header">
      <h2>Events</h2>
      <button class="add-event" @click="addNewEvent">+ Add Event</button>
    </div>

    <div v-if="props.loading">Loading events...</div>
    <table v-else>
      <thead>
        <tr>
          <th>ID</th>
          <th>Title</th>
          <th>Signup</th>
          <th>Event</th>
          <th>Streamers</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="event in props.events"
          :key="event.id || 'new'"
          :class="{ 'selected': event.id === selectedEvent?.id }"
          @click="emit('update:selected-event', event)"
        >
          <td>{{ event.id || 'New' }}</td>
          <td>
            <input
              v-if="event.editing"
              v-model="event.title"
              type="text"
            />
            <span v-else>{{ event.title }}</span>
          </td>
          <td v-if="event.editing">
            <div>S: <input
              type="datetime-local"
              v-model="event.signup_start"
            /></div>
            <div>E: <input
              type="datetime-local"
              v-model="event.signup_end"
            /></div>
          </td>
          <td v-else>
            <div>S: {{ event.signup_start }}</div>
            <div>E: {{ event.signup_end }}</div>
          </td>
          <td v-if="event.editing">
            <div>S: <input
              type="datetime-local"
              v-model="event.event_start"
            /></div>
            <div>E: <input
              type="datetime-local"
              v-model="event.event_end"
            /></div>
          </td>
          <td v-else>
            <div>S: {{ event.event_start }}</div>
            <div>E: {{ event.event_end }}</div>
          </td>
          <td>{{ event.streamer_count || 0 }}</td>
          <td>
            <button 
              v-if="!event.editing"
              class="edit-button"
              @click="startEditing(event)"
            >Edit</button>
            <button 
              v-if="event.editing && isModified"
              class="edit-button"
              @click="saveEvent(event)"
            >*Save</button>
            <button 
              v-if="event.editing && !isModified"
              class="edit-button"
              @click="stopEditing(event)"
            >Done</button>
          </td>
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

html[data-theme="dark"] tr.selected td {
  background-color: var(--color-c);
}
html[data-theme="light"] tr.selected td {
  background-color: var(--color-c);
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

.edit-button {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background-color: var(--color-b);
  color: white;
  border: none;
  cursor: pointer;
}

.edit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>