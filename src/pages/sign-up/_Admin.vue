<script setup lang="ts">

import AdminEvents from './_AdminEvents.vue';
import AdminSchedule from './_AdminSchedule.vue';
import type { NHEvent } from './_interfaces/NHEvent';
import { formatDateTime } from './_utils/utils';
import { onMounted, ref } from 'vue';

const props = defineProps<({
  nodeApi: String,
})>();

const events = ref<NHEvent[]>([]);
const loading = ref(true);

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
  } catch (error) {
    console.error('Failed to fetch events:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchEvents);
</script>

<template>
  <AdminEvents
    :node-api="props.nodeApi"
    :events="events"
    :loading="loading"
    @update:events="fetchEvents"
  />
  <AdminSchedule
    :node-api="props.nodeApi"
    :events="events"
    :loading="loading"
  />
</template>

<style scoped>
</style>