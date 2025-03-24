<script setup lang="ts">

import AdminCharity from './_AdminCharity.vue';
import AdminEvents from './_AdminEvents.vue';
import AdminParticipants from './_AdminParticipants.vue';
import AdminSchedule from './_AdminSchedule.vue';
import type { NHEvent } from './_interfaces/NHEvent';
import { formatDateTime } from './_utils/utils';
import { onMounted, ref, watch } from 'vue';
import { useParticipantService } from './_services/participant.service';

const props = defineProps<({
  nodeApi: string,
})>();

const currentView = ref('/admin/schedule');
const selectedEvent = ref<NHEvent | null>(null);
const events = ref<NHEvent[]>([]);
const loading = ref(true);

const { participants, loadingParticipants, fetchParticipants } = useParticipantService(props.nodeApi);
async function fetchEvents() {
  try {
    const response = await fetch(`${props.nodeApi}/events`);
    const data = await response.json();
    events.value = data.events.map((event: NHEvent) => ({
      ...event,
      signup_start: formatDateTime(new Date(event.signup_start)),
      signup_end: formatDateTime(new Date(event.signup_end)),
      event_start: formatDateTime(new Date(event.event_start)),
      event_end: formatDateTime(new Date(event.event_end)),
      editing: false,
    }));
    if (selectedEvent.value === null) {
      selectedEvent.value = events.value[events.value.length - 1];
    } else {
      selectedEvent.value = events.value.find(event => event.id === selectedEvent.value?.id) ?? null;
    }
  } catch (error) {
    console.error('Failed to fetch events:', error);
  } finally {
    loading.value = false;
  }
}

watch(
  () => selectedEvent.value,
  async (newEvent) => {
    if (!newEvent) {
      return;
    }
    try {
      if (newEvent.id) {
        await fetchParticipants(newEvent.id);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  },
  { immediate: true }
);


function updateViewFromHash() {
  const hash = window.location.hash;
  
  if (hash.startsWith('#/admin')) {
    const subRoute = hash.length > 7 ? hash : '#/admin/schedule';
    currentView.value = subRoute.substring(1);
  }
}

onMounted(() => {
  fetchEvents();
  updateViewFromHash();
  window.addEventListener('hashchange', updateViewFromHash);
});
</script>

<template>
  <AdminEvents
    :node-api="props.nodeApi"
    :events="events"
    :selected-event="selectedEvent"
    :loading="loading"
    @update:events="fetchEvents"
    @update:selected-event="selectedEvent = $event"
  />
  <nav class="sub">
    <a
      href="/sign-up#/admin/schedule"
      :class="{ active: currentView === '/admin/schedule' }">
      Schedule
    </a>
    <a
      href="/sign-up#/admin/participants"
      :class="{ active: currentView === '/admin/participants' }">
      Participants
    </a>
    <a
      href="/sign-up#/admin/charity"
      :class="{ active: currentView === '/admin/charity' }">
      Charity
    </a>
  </nav>
  <AdminSchedule
    v-if="currentView === '/admin/schedule'"
    :node-api="props.nodeApi"
    :events="events"
    :selected-event="selectedEvent"
    :loading="loading"
  />
  <AdminParticipants
    v-if="currentView === '/admin/participants'"
    :events="events"
    :selected-event="selectedEvent"
    :loading="loading || loadingParticipants"
    :participants="participants"
  />
  <AdminCharity
    v-if="currentView === '/admin/charity'"
    :loading="loading"
    :node-api="props.nodeApi"
    :selected-event="selectedEvent"
    :participants="participants"
    @charity-selected="fetchEvents"
  />
</template>

<style scoped>
</style>
