<script setup lang="ts">

import { computed, ref, onMounted } from 'vue';

interface NHEvent {
  id?: number;
  title: string;
  signup_start: string;
  signup_end: string;
  event_start: string;
  event_end: string;
  streamer_count: number;
  editing: boolean;
}

function formatDateTime(d: Date) {
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const hours = d.getUTCHours();
  const minutes = d.getUTCMinutes();
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

const editingModel = ref<NHEvent | null>(null);

function addNewEvent() {
  const newEvent: NHEvent = {
    title: 'New Event',
    signup_start: formatDateTime(new Date()),
    signup_end: formatDateTime(new Date()),
    event_start: formatDateTime(new Date()),
    event_end: formatDateTime(new Date()),
    streamer_count: 0,
    editing: true
  };
  events.value.push(newEvent);
  startEditing(events.value[events.value.length - 1]);
}

function stopEditing(selectedEvent: NHEvent) {
  selectedEvent.editing = false;
}

function startEditing(selectedEvent: NHEvent) {
  events.value.forEach(event => {
    event.editing = event === selectedEvent;
  });
  editingModel.value = { ...selectedEvent };
}

async function saveEvent(selectedEvent: NHEvent) {
  console.log('saving event:', JSON.stringify(selectedEvent));
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
    fetchEvents();
  }
}

const isModified = computed(() => {
  if (!editingModel.value) return false;
  const currentEvent = events.value.find(e => e.editing);
  if (!currentEvent) return false;

  return (
    editingModel.value.title !== currentEvent.title ||
    editingModel.value.signup_start !== currentEvent.signup_start ||
    editingModel.value.signup_end !== currentEvent.signup_end ||
    editingModel.value.event_start !== currentEvent.event_start ||
    editingModel.value.event_end !== currentEvent.event_end
  );
});

const props = defineProps<({
  nodeApi: String,
})>();
const events = ref<NHEvent[]>([]);
const loading = ref(true);

async function fetchEvents() {
  try {
    const response = await fetch(`${props.nodeApi}/events`);
    const data = await response.json();
    events.value = data.events.map(event => ({
      ...event,
      signup_start: formatDateTime(new Date(event.signup_start)),
      signup_end: formatDateTime(new Date(event.signup_end)),
      event_start: formatDateTime(new Date(event.event_start)),
      event_end: formatDateTime(new Date(event.event_end)),
      editing: false,
    }));
  } catch (error) {
    console.error('Failed to fetch events:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchEvents);
</script>

<template>
  <section class="c double admin-events">
    <div class="header">
      <h2>Events</h2>
      <button class="add-event" @click="addNewEvent">+ Add Event</button>
    </div>

    <div v-if="loading">Loading events...</div>
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
        <tr v-for="event in events" :key="event.id || 'new'">
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

th, td {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid var(--color-light);
  font-size: 0.9rem;
}

th {
  background-color: var(--color-dark-highlight);
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