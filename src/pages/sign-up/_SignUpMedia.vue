<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import SignUpSaveState from './_SignUpSaveState.vue';
import {SaveState} from "./_SaveState";

const isDev = false;
const nodeApi = isDev ? 'http://localhost:3000' : 'https://api.nethackathon.com';

const state = reactive({
  loading: true,
  formSaveState: SaveState.Unsaved,
});

const convertDate = (date) => {
  const d = date ? new Date(date) : new Date();
  // Convert from 2021-08-05T00:00:00.000Z format to 2021-08-05T00:00 in local TZ
  return d.toISOString().slice(0, 16);
};

const defaultModel = {
  selectedEvent: null,
  eventMediaId: '',
  mediaType: '',
  videoType: '',
  platform: '',
  mediaUrl: '',
  thumbnailUrl: '',
  title: '',
  description: '',
  startTime: convertDate(new Date()),
  endTime: convertDate(new Date()),
};
const model = reactive({...defaultModel});

const submitButtonText = computed(() => {
  return model.eventMediaId && model.eventMediaId !== '' ? 'Update' : 'Submit';
});

const events = ref([]);
const eventMedia = ref([]);
const filteredEventMedia = computed(() => {
  return eventMedia.value.filter((em) => em.event_id === model.selectedEvent.id);
});

onMounted(async () => {
  try {
    state.loading = true;
    const eventsUrl = `${nodeApi}/events`;
    let response = await fetch(eventsUrl, {
      method: 'GET'
    });
    if (!response.ok) {
      throw new Error(`Failed to connect to ${eventsUrl}.`);
    }
    const data = await response.json();
    events.value = data.events.sort((ea, eb) => eb.event_start.localeCompare(ea.event_start));
    model.selectedEvent = events.value[0];

    const eventMediaUrl = `${nodeApi}/signup/event-media/get`;
    response = await fetch(eventMediaUrl, {
      method: 'GET',
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error(`Failed to connect to ${eventMediaUrl}.`);
    }
    eventMedia.value = await response.json();

    watch(model, () => {
      state.formSaveState = SaveState.Unsaved;
    });

    watch(() => model.eventMediaId, (eventMediaId) => {
      const em = eventMedia.value.find((em) => em.id === eventMediaId);
      if (em) {
        model.eventMediaId = em.id;
        model.mediaType = em.media_type;
        model.videoType = em.video_type;
        model.platform = em.platform;
        model.mediaUrl = em.media_url;
        model.thumbnailUrl = em.thumbnail_url;
        model.title = em.title;
        model.description = em.description;
        model.startTime = convertDate(em.start_time);
        model.endTime = convertDate(em.end_time);
      } else {
        model.eventMediaId = defaultModel.eventMediaId;
        model.mediaType = defaultModel.media_type;
        model.videoType = defaultModel.video_type;
        model.platform = defaultModel.platform;
        model.mediaUrl = defaultModel.media_url;
        model.thumbnailUrl = defaultModel.thumbnail_url;
        model.title = defaultModel.title;
        model.description = defaultModel.description;
        model.startTime = defaultModel.start_time;
        model.endTime = defaultModel.end_time;
      }
    });
  } catch (err) {
    console.error(err)
  } finally {
    state.loading = false;
  }
});


  const submitForm = async () => {
    try {
      const isEditing = model.eventMediaId && model.eventMediaId !== '';
      state.formSaveState = SaveState.Saving;
      const url = isEditing ? `${nodeApi}/signup/event-media/update` : `${nodeApi}/signup/event-media/create`;
      const data = {...model};
      data.eventId = model.selectedEvent?.id ?? '';
      await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      state.formSaveState = SaveState.Error;
      console.error(error);
    } finally {
      state.formSaveState = SaveState.Saved;
    }
  };

  const mediaType = ref([
    {
      name: "Video",
      value: "video",
    },
    {
      name: "Playlist",
      value: "playlist",
    },
    {
      name: "Image",
      value: "image",
    },
  ]);
  const videoType = ref([
    {
      name: "Full Segment",
      value: "full_segment",
    },
    {
      name: "Highlight",
      value: "highlight",
    },
    {
      name: "Other",
      value: "other",
    },
  ]);
  /*
+---------------+------------------------------------------+------+-----+---------+----------------+
| Field         | Type                                     | Null | Key | Default | Extra          |
+---------------+------------------------------------------+------+-----+---------+----------------+
| id            | bigint unsigned                          | NO   | PRI | NULL    | auto_increment |
| event_id      | bigint unsigned                          | YES  | MUL | NULL    |                |
| media_type    | enum('video','playlist','image')         | NO   |     | NULL    |                |
| video_type    | enum('full_segment','highlight','other') | NO   |     | NULL    |                |
| platform      | varchar(255)                             | YES  |     | NULL    |                |
| media_url     | varchar(255)                             | YES  |     | NULL    |                |
| thumbnail_url | varchar(255)                             | YES  |     | NULL    |                |
| title         | varchar(255)                             | YES  |     | NULL    |                |
| description   | varchar(1024)                            | YES  |     | NULL    |                |
| start_time    | datetime                                 | YES  |     | NULL    |                |
| end_time      | datetime                                 | YES  |     | NULL    |                |
+---------------+------------------------------------------+------+-----+---------+----------------+
   */
</script>

<template>
  <section class="c double">
    <p>
      Do you have any Twitch Clips, YouTube videos, or playlists you'd like to share with us? Fill out the form below!
    </p>
    <form ref="form" @submit.prevent="submitForm">
      <p>
        <label for="eventId">Which event?</label><br>
        <select
            id="eventId"
            v-model="model.selectedEvent"
        >
          <option v-for="event in events" :value="event">{{event.title}}</option>
        </select>
      </p>
      <p>
        <label for="eventMediaId">Add new or edit existing media?</label><br>
        <select
            id="eventMediaId"
            v-model="model.eventMediaId"
        >
          <option value="">Add new media</option>
          <option v-for="em in filteredEventMedia" :value="em.id">Edit: {{em.title}}</option>
        </select>
      </p>
      <p>
        <label for="slotLength">Media type:</label><br>
        <select
          id="slotLength"
          v-model="model.mediaType"
        >
          <option disabled value="">Please select one:</option>
          <option v-for="mType in mediaType" :value="mType.value">{{mType.name}}</option>
        </select>
      </p>
      <p>
        <label for="slotLength">Video type (or Other if an image):</label><br>
        <select
            id="slotLength"
            v-model="model.videoType"
        >
          <option disabled value="">Please select one:</option>
          <option v-for="vType in videoType" :value="vType.value">{{vType.name}}</option>
        </select>
      </p>

      <p>
        <label for="platform">Platform (YouTube, Twitch, Vimeo, etc.):</label><br>
        <input
          type="text"
          id="platform"
          v-model="model.platform"
        ></input>
      </p>

      <p>
        <label for="mediaUrl">Media URL:</label><br>
        <input
            type="text"
            id="mediaUrl"
            v-model="model.mediaUrl"
        ></input>
      </p>

      <p>
        <label for="thumbnailUrl">Thumbnail URL:</label><br>
        <input
            type="text"
            id="thumbnailUrl"
            v-model="model.thumbnailUrl"
        ></input>
      </p>

      <p>
        <label for="title">Media title:</label><br>
        <input
            type="text"
            id="title"
            v-model="model.title"
        ></input>
      </p>

      <p>
        <label for="description">Description:</label><br>
        <textarea
            id="description"
            v-model="model.description"
            cols="50"
            rows="3"
        ></textarea>
      </p>

      <p>
        <label for="startTime">Start time of video (UTC):</label><br>
        <input
            type="datetime-local"
            id="startTime"
            v-model="model.startTime"
            :min="convertDate(model.selectedEvent?.event_start)"
            :max="convertDate(model.selectedEvent?.event_end)"
        ></input>
      </p>

      <p>
        <label for="endTime">End time of video (UTC):</label><br>
        <input
            type="datetime-local"
            id="endTime"
            v-model="model.endTime"
            :min="convertDate(model.selectedEvent?.event_start)"
            :max="convertDate(model.selectedEvent?.event_end)"
        ></input>
      </p>

      <p>
        <button id="submitButton" type="submit">{{submitButtonText}}</button>
        <SignUpSaveState :saveState="state.formSaveState" />
      </p>
    </form>
  </section>
</template>

<style scoped>
  button, input, textarea, select {
    font-family: "DejaVu Sans Mono", "Menlo", sans-serif;
    font-size: 15pt;
  }
</style>
