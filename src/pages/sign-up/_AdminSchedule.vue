<script setup lang="ts">

import type { EventSchedule, ScheduleSlot } from './_interfaces/EventSchedule';
import type { NHEvent } from './_interfaces/NHEvent';
import { DateTime } from 'luxon';
import { Interval } from 'luxon';
import { convertApiStreamerSchedule, type StreamerSchedule } from './_interfaces/StreamerSchedules';
import { debounce } from 'lodash-es';
import { ref, watch, computed } from 'vue';
import { useSchedule } from './_composables/useSchedule';

const selectedEvent = ref<NHEvent | null>(null);
const eventSchedule = ref<EventSchedule | null>(null);
const streamerSchedules = ref<StreamerSchedule[]>([]);
const dragging = ref(false);
const loading = ref(true);
const schedulePublished = ref(false);

const importJsonText = ref('');
const importError = ref('');

const props = defineProps<({
  nodeApi: String,
  events: NHEvent[],
})>();

const eventStartTime = computed(() => selectedEvent.value?.event_start || '');
const eventEndTime = computed(() => selectedEvent.value?.event_end || '');
const scheduledSlots = computed(() => eventSchedule.value?.schedule || []);

const selectedTimezone = ref(Intl.DateTimeFormat().resolvedOptions().timeZone);

const {
  scheduledSlots: workingScheduledSlots,
  modified: scheduleModified,
  schedule,
  mergedSchedule,
  scheduleStreamer,
  unscheduleStreamer,
  updateNotes,
  saveSchedule,
  updateFullSchedule
} = useSchedule(
  eventStartTime,
  eventEndTime,
  streamerSchedules,
  scheduledSlots,
  selectedTimezone
);

watch(
  () => selectedEvent.value,
  async (newEvent) => {
    if (!newEvent) {
      eventSchedule.value = null;
      return;
    }
    loading.value = true;
    try {
      if (newEvent.id) {
        eventSchedule.value = await fetchEventSchedule(newEvent.id);
        streamerSchedules.value = await fetchStreamerSchedules(newEvent.id);
        schedulePublished.value = newEvent.schedule_published;
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      loading.value = false;
    }
  },
  { immediate: true }
);

async function fetchEventSchedule(eventId: number): Promise<EventSchedule> {
  let returnSchedule: EventSchedule = {
    schedule: [],
  };
  try {
    const response = await fetch(`${props.nodeApi}/event/${eventId}/schedule`);
    const data = await response.json() as EventSchedule;
    returnSchedule = data;
  } catch (error) {
    console.error('Failed to fetch events:', error);
  }
  return returnSchedule;
}

async function fetchStreamerSchedules(eventId: number): Promise<StreamerSchedule[]> {
  const response = await fetch(`${props.nodeApi}/event/${eventId}/streamers/schedule`);
  const data = await response.json();
  return data.streamers.map(convertApiStreamerSchedule);
}

function handleDragStart(event: DragEvent, streamer: string) {
  if (!event.dataTransfer) return;
  event.dataTransfer.setData('application/json', JSON.stringify({
    streamer,
  }));
  dragging.value = true;
}

function handleDrop(event: DragEvent, slot: Interval) {
  event.preventDefault();
  if (!event.dataTransfer || !selectedEvent.value?.id) return;
  
  const data = JSON.parse(event.dataTransfer.getData('application/json'));
  scheduleStreamer(data.streamer, slot);
  dragging.value = false;
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
}

async function handleSaveSchedule() {
  if (!selectedEvent.value?.id) return;
  
  try {
    const response = await fetch(`${props.nodeApi}/event/${selectedEvent.value.id}/schedule`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schedule: mergedSchedule.value
      }),
    });
    
    if (!response.ok) throw new Error('Failed to save schedule');
    
    saveSchedule();
  } catch (error) {
    console.error('Error saving schedule:', error);
  }
}

async function handlePublishSchedule() {
  if (!selectedEvent.value?.id) return;
  
  try {
    const response = await fetch(`${props.nodeApi}/event/${selectedEvent.value.id}/schedule/publish`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) throw new Error('Failed to publish/unpublish schedule');
    schedulePublished.value = !schedulePublished.value;
  } catch (error) {
    console.error('Error publishing/unpublishing schedule:', error);
  }
}

const debouncedUpdateNotes = debounce((slot: Interval, notes: string) => {
  updateNotes(slot, notes);
}, 1000);

function handleUpdateNotes(slot: Interval, event: Event) {
  const target = event.target as HTMLTextAreaElement;
  debouncedUpdateNotes(slot, target.value);
}

function importScheduleFromJson() {
  importError.value = '';
  
  try {
    const scheduleData = JSON.parse(importJsonText.value);
    
    if (!scheduleData.plannedStreamers || !Array.isArray(scheduleData.plannedStreamers)) {
      importError.value = 'Invalid JSON format: plannedStreamers array is missing';
      return;
    }
    
    const newSchedule: ScheduleSlot[] = [];
    
    for (const streamer of scheduleData.plannedStreamers) {
      if (!streamer.username || !streamer.startTime || !streamer.endTime) {
        importError.value = 'Invalid streamer data: missing required fields';
        continue;
      }
      
      const startDateTime = DateTime.fromMillis(streamer.startTime);
      const endDateTime = DateTime.fromMillis(streamer.endTime);
      
      // Ensure we have valid ISO strings
      const startTimeISO = startDateTime.toISO() || '';
      const endTimeISO = endDateTime.toISO() || '';
      
      if (!startTimeISO || !endTimeISO) {
        importError.value = `Invalid datetime conversion for streamer ${streamer.username}`;
        continue;
      }
      
      newSchedule.push({
        username: streamer.username,
        start_time: startTimeISO,
        end_time: endTimeISO,
        notes: ''
      });
    }
    
    updateFullSchedule(newSchedule);
    
    importJsonText.value = '';
    
  } catch (error) {
    importError.value = `Error parsing JSON: ${error instanceof Error ? error.message : String(error)}`;
    console.error('Import error:', error);
  }
}

function handleRemoveStreamer(slot: Interval) {
  unscheduleStreamer(slot);
}

const commonTimezones = computed(() => [
  { value: Intl.DateTimeFormat().resolvedOptions().timeZone, label: 'Local Time' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'UTC', label: 'UTC' }
]);
</script>

<template>
  <section class="c double">
    <div class="header flex-row">
      <div class="flex-column">
        <h2 class="mb-0">Schedule</h2>
        
        <div>
          <select 
            id="timezone-select" 
            v-model="selectedTimezone" 
          >
            <option v-for="tz in commonTimezones" :key="tz.value" :value="tz.value">
              {{ tz.label }}
            </option>
          </select>
        </div>
      </div>
      <div>
        <div class="flex-column">
          <div class="flex-row">
            <button 
              v-if="selectedEvent?.id"
              @click="handlePublishSchedule"
              class="save-button">
              {{ schedulePublished ? 'Unpublish Schedule' : 'Publish Schedule' }}
            </button>
            <button 
              @click="handleSaveSchedule"
              :disabled="!scheduleModified"
              class="save-button">
              {{ scheduleModified ? '*Save Schedule' : 'Save Schedule' }}
            </button>
          </div>
          <select v-model="selectedEvent">
            <option v-for="event in props.events" :key="event.id" :value="event">{{ event.title }}</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="selectedEvent && loading">Loading schedule...</div>
    <div v-if="selectedEvent && !loading && eventSchedule">
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Time</th>
            <th>Available</th>
            <th @dragover="handleDragOver">Scheduled</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody v-for="day in schedule" :key="day.day.start?.toMillis()">
          <tr>
            <td colspan="5" class="dateHeader">{{ day.formattedDay }}</td>
          </tr>
          <tr
            v-for="slotInfo in day.slots"
            :key="slotInfo.slot.start?.toMillis()"
            :class="{'covered': slotInfo.scheduledStreamer, 'uncovered': !slotInfo.scheduledStreamer}">
            <td>{{ slotInfo.scheduledStreamer ? '✅' : '' }}</td>
            <td>{{ slotInfo.timeRange }}</td>
            <td>
              <span 
                v-for="streamer in slotInfo.availableStreamers" 
                :key="streamer"
                draggable="true"
                @dragstart="handleDragStart($event, streamer)"
                class="draggable-name">
                {{ streamer }}
              </span>
            </td>
            <td 
              @drop="handleDrop($event, slotInfo.slot)" 
              @dragover="handleDragOver"
              :class="{'droppable-cell': dragging}">
              <div v-if="slotInfo.scheduledStreamer" class="scheduled-streamer">
                {{ slotInfo.scheduledStreamer.username }}
                <button 
                  class="remove-streamer-btn" 
                  @click="handleRemoveStreamer(slotInfo.slot)"
                  title="Remove scheduled streamer">
                  ✕
                </button>
              </div>
            </td>
            <td>
              <textarea
                v-if="slotInfo.scheduledStreamer && slotInfo.isFirstSlotForStreamer"
                cols="30"
                rows="3"
                :value="slotInfo.scheduledStreamer?.notes || ''"
                @input="handleUpdateNotes(slotInfo.slot, $event)"
              /> 
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="json-import-section">
        <div class="import-controls">
          <textarea 
            v-model="importJsonText"
            rows="3" 
            placeholder="JSON: { &quot;plannedStreamers&quot;: [{ &quot;username&quot;: &quot;streamer1&quot;, &quot;startTime&quot;: 1714761600000, &quot;endTime&quot;: 1714765200000 }, ...] } }"
            class="json-import-textarea"
          ></textarea>
          <button 
            @click="importScheduleFromJson" 
            class="import-button"
            :disabled="!importJsonText">
            Import
          </button>
        </div>
        <div v-if="importError" class="import-error">{{ importError }}</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.flex-row {
  display: flex;
  flex-direction: row;
}

.flex-column {
  display: flex;
  flex-direction: column;
}

.mb-0 {
  margin-bottom: 0;
}

.header {
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

.covered {
  background-color: rgba(0, 255, 0, 0.1);
}

.uncovered {
  background-color: rgba(255, 0, 0, 0.1);
}

.dateHeader {
  background-color: var(--color-dark-highlight);
  font-weight: bold;
}

.draggable-name {
  display: inline-block;
  padding: 2px 6px;
  margin: 2px;
  background-color: var(--color-dark-highlight);
  border-radius: 4px;
  cursor: move;
}

.droppable-cell {
  min-height: 24px;
  border: 1px dashed transparent;
}

.droppable-cell:empty {
  border-color: var(--color-light);
}

tr:hover .droppable-cell {
  border-color: var(--color-light);
}

.json-import-section {
  margin: 1rem 0;
}

.import-controls {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.json-import-textarea {
  flex: 1;
  font-family: monospace;
  padding: 0.5rem;
  border: 1px solid var(--color-light);
  border-radius: 4px;
  min-height: 100px;
}

.import-error {
  color: red;
  margin-top: 0.5rem;
}

.import-button {
  background-color: var(--color-b);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  height: 42px;
}

.import-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-button {
  background-color: var(--color-b);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin: 1rem;
}

.save-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modified-indicator {
  color: var(--color-b);
  font-size: 0.8rem;
  margin-left: 0.5rem;
  vertical-align: super;
}

.scheduled-streamer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  padding: 2px 4px;
  display: inline-flex;
  background-color: rgba(255, 255, 255, 0.5);
}

.remove-streamer-btn {
  background: none;
  border: none;
  color: #333;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0 0.3rem;
  margin-left: 4px;
  opacity: 0.7;
  border-left: 1px solid rgba(0, 0, 0, 0.1);
}

.remove-streamer-btn:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.05);
}
</style>