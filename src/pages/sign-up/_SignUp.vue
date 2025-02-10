<script setup lang="ts">
import Admin from './_Admin.vue';
import SignIn from './_SignIn.vue';
import SignUpChecklist from './_SignUpChecklist.vue';
import SignUpForm from './_SignUpForm.vue';
import SignUpMedia from './_SignUpMedia.vue';
import SignUpSchedule from './_SignUpSchedule.vue';
import SignUpSurvey from './_SignUpSurvey.vue';
import StreamerFaq from './_StreamerFaq.vue';
import type { Interval } from 'luxon';
import type { NHEvent } from '../../types/NHEvent';
import type { Ref } from 'vue';
import { SaveState } from './_SaveState';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { debounce } from 'lodash-es';

const props = defineProps<({
  nodeApi: string,
  currentEvent: NHEvent,
  eventActive: boolean,
  eventUpcoming: boolean,
  eventConcluded: boolean
})>();

const state = reactive({
  loggedIn: false,
  loading: true,
  formSaveState: SaveState.Saved,
  scheduleSaveState: SaveState.Saved,
  checklistSaveState: SaveState.Saved,
  surveySaveState: SaveState.Saved,
});

const signup = reactive({
  signedUp: false,
  pronouns: '',
  discordUsername: '',
  notes: '',
  slotLength: '',
  username: '',
  startTime: '',
  endTime: '',
  nextStreamer: '',
  isAdmin: false,
});

const checklist = ref({
  available: false,
  testStream: false,
  vodPermission: false,
  vodsOn: false,
  raid: false,
  raidPermissions: false,
  hardfoughtAccount: false,
  nethackrc: false,
  sharedLogin: false,
  copyrc: false,
  suggestedCharity: '',
  rememberToSave: false,
});

const survey = ref({
  rumors: '',
  tshirt: '',
  gravestone: '',
  notes: '',
  contactPermission: false,
  contact: ''
});

// 0 = not available, 1 = available, 2 = preferred
type Schedule = {
  [timestamp: number]: 0 | 1 | 2;
};
const schedule: Ref<Schedule> = ref({});

const scheduleDebounceSave = debounce(async () => {
  state.scheduleSaveState = SaveState.Saving;
  try {
    const url = `${props.nodeApi}/signup/schedule`;
    await fetch(url, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventId: props.currentEvent.id,
        schedule: schedule.value,
      }),
    });
  } catch (error) {
    console.error(error);
    state.scheduleSaveState = SaveState.Error;
  } finally {
    state.scheduleSaveState = SaveState.Saved;
  }
}, 1000);
const surveyDebounceSave = debounce(async () => {
  state.surveySaveState = SaveState.Saving;
  try {
    const url = `${props.nodeApi}/signup/survey`;
    await fetch(url, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(survey.value),
    });
  } catch (error) {
    console.error(error);
    state.surveySaveState = SaveState.Error;
  } finally {
    state.surveySaveState = SaveState.Saved;
  }
}, 1000);
const checklistDebounceSave = debounce(async () => {
  state.checklistSaveState = SaveState.Saving;
  try {
    const url = `${props.nodeApi}/signup/checklist`;
    await fetch(url, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventId: props.currentEvent.id,
        checklist: checklist.value,
      }),
    });
  } catch (error) {
    console.error(error);
    state.checklistSaveState = SaveState.Error;
  } finally {
    state.checklistSaveState = SaveState.Saved;
  }
}, 1000);
const formDebounceSave = debounce(async () => {
  state.formSaveState = SaveState.Saving;
  try {
    const url = `${props.nodeApi}/signup/text`;
    const data = {
      eventId: props.currentEvent.id,
      signedUp: signup.signedUp,
      discordUsername: signup.discordUsername,
      notes: signup.notes,
      pronouns: signup.pronouns,
      slotLength: signup.slotLength,
    };
    await fetch(url, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error(error);
    state.formSaveState = SaveState.Error;
  } finally {
    state.formSaveState = SaveState.Saved;
  }
}, 1000);

const scheduleSlot = (slot: Interval) => {
  if (!slot.start) return;
  const start = slot.start.toMillis();
  const modifiedSchedule: Schedule = {...schedule.value};
  if (Object.prototype.hasOwnProperty.call(modifiedSchedule, start)) {
    modifiedSchedule[start] = (modifiedSchedule[start] + 1) % 3 as 0 | 1 | 2;
  } else {
    modifiedSchedule[start] = 1;
  }
  schedule.value = modifiedSchedule;
};

const currentPath = ref('/');

const currentView = computed(() => {
  return currentPath.value.slice(1) || '/'
});

onMounted(async () => {
  try {
    currentPath.value = window.location.hash;
    window.addEventListener('hashchange', () => {
      currentPath.value = window.location.hash;
    });
    const url = `${props.nodeApi}/signup`;
    state.loading = true;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error(`Failed to connect to ${url}.`);
    }
    const data = await response.json();
    schedule.value = JSON.parse(data.schedule);
    checklist.value = JSON.parse(data.checklist);
    survey.value = JSON.parse(data.survey);
    signup.signedUp = data.signedUp;
    signup.pronouns = data.pronouns;
    signup.isAdmin = data.isAdmin;
    signup.discordUsername = data.discordUsername;
    signup.notes = data.notes;
    signup.slotLength = data.slotLength;
    signup.username = data.username;
    signup.startTime = data.startTime;
    signup.endTime = data.endTime;
    signup.nextStreamer = data.nextStreamer;
    state.loggedIn = true;
    window.dispatchEvent(new CustomEvent('userLogin', { 
      detail: { 
        username: data.username,
        loggedIn: true 
      }
    }));
  } catch (err) {
    console.error(err)
    state.loggedIn = false;
    window.dispatchEvent(new CustomEvent('userLogin', { 
      detail: { 
        username: '',
        loggedIn: false 
      }
    }));
  } finally {
    state.loading = false;
    watch(signup, () => {
      state.formSaveState = SaveState.Unsaved;
      formDebounceSave();
    });
    watch(schedule, () => {
      state.scheduleSaveState = SaveState.Unsaved;
      scheduleDebounceSave();
    }, {deep: true});
    watch(checklist, () => {
      state.checklistSaveState = SaveState.Unsaved;
      checklistDebounceSave();
    }, {deep: true});
    watch(survey, () => {
      state.surveySaveState = SaveState.Unsaved;
      surveyDebounceSave();
    }, {deep: true});
  }
});

</script>

<template>
  <nav class="sub" v-if="state.loggedIn">
    <a v-if="signup.isAdmin" href="#/admin">Admin</a>
    <a v-if="eventUpcoming" href="#/">Preferences</a>
    <a v-if="eventUpcoming" href="#/availability">Availability</a>
    <a v-if="eventUpcoming" href="#/checklist">Checklist</a>
    <a v-if="eventActive || eventConcluded" href="#/media">Media</a>
    <a v-if="eventActive || eventConcluded" href="#/survey">Survey</a>
    <a href="#/faq">FAQ</a>
  </nav>
  <SignIn
      v-if="!state.loggedIn"
      :nodeApi="props.nodeApi"
      :currentEvent="props.currentEvent"
  />
  <Admin
    v-if="signup.isAdmin && currentView === '/admin'"
    :nodeApi="props.nodeApi"
  />
  <SignUpChecklist
      v-if="state.loggedIn && !state.loading && currentView === '/checklist'"
      :eventTitle="props.currentEvent.title"
      :nextStreamer="signup.nextStreamer"
      :username="signup.username"
      :startTime="signup.startTime"
      :endTime="signup.endTime"
      v-model="checklist"
      :saveState="state.checklistSaveState"
  />
  <SignUpForm
      v-if="state.loggedIn && !state.loading && currentView === '/'"
      v-model="signup"
      :saveState="state.formSaveState"
  />
  <SignUpSchedule
      v-if="state.loggedIn && !state.loading && currentView === '/availability'"
      :eventId="props.currentEvent.id"
      :startDate="props.currentEvent.event_start"
      :endDate="props.currentEvent.event_end"
      :schedule="schedule"
      :saveState="state.scheduleSaveState"
      @scheduleSlot="scheduleSlot"
  />
  <SignUpSurvey
      v-if="state.loggedIn && !state.loading && currentView === '/survey'"
      v-model="survey"
      :saveState="state.surveySaveState"
  />
  <SignUpMedia
      v-if="state.loggedIn && !state.loading && currentView === '/media'"
      :nodeApi="props.nodeApi"
  />
  <StreamerFaq
      v-if="state.loggedIn && !state.loading && currentView === '/faq'"
  />
</template>

<style scoped>
section.login {
  padding: 0.5rem;
}

.login {
  float: right;
}

nav.sub {
  grid-column: 1 / 3;
}

nav.sub > a {
  font-size: 12pt;
}
</style>./_Admin.vue
