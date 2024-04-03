<script setup lang="ts">
import SignIn from './_SignIn.vue';
import SignUpChecklist from './_SignUpChecklist.vue';
import SignUpForm from './_SignUpForm.vue';
import SignUpSchedule from './_SignUpSchedule.vue';
import type {Interval} from 'luxon';
import type {NHEvent} from '../../types/NHEvent';
import type {Ref} from 'vue';
import {computed, onMounted, reactive, ref, watch} from 'vue';
import {debounce} from 'lodash-es';

const SaveState = {
  Saved: 0,
  Unsaved: 1,
  Saving: 2,
  Error: 3,
};

const state = reactive({
  loggedIn: false,
  loading: true,
  formSaveState: SaveState.Saved,
  scheduleSaveState: SaveState.Saved,
  checklistSaveState: SaveState.Saved,
});

const saveStateToText = (saveState: number) => {
  switch (saveState) {
    case SaveState.Saved:
      return 'Saved ✅︎';
    case SaveState.Unsaved:
      return 'Unsaved 🟡';
    case SaveState.Saving:
      return 'Saving 🔄';
    default:
      return 'Error 🛑';
  }
};
const showChecklist = computed(() => {
  return (
      !props.currentEvent.signupsOpen &&
          signup.startTime &&
          signup.endTime
  );
});
const formSaveStateMessage = computed(() => {
  return saveStateToText(state.formSaveState);
});
const scheduleSaveStateMessage = computed(() => {
  return saveStateToText(state.scheduleSaveState);
});
const checklistSaveStateMessage = computed(() => {
  return saveStateToText(state.scheduleSaveState);
});

const signup = reactive({
  pronouns: '',
  discordUsername: '',
  notes: '',
  slotLength: '',
  username: '',
  startTime: '',
  endTime: '',
  nextStreamer: '',
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

// 0 = not available, 1 = available, 2 = preferred
type Schedule = {
  [timestamp: number]: 0 | 1 | 2;
};
const schedule: Ref<Schedule> = ref({});

const scheduleDebounceSave = debounce(async () => {
  state.scheduleSaveState = SaveState.Saving;
  try {
    const url = `${nodeApi}/signup/schedule`;
    await fetch(url, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(schedule.value),
    });
  } catch (error) {
    console.error(error);
    state.scheduleSaveState = SaveState.Error;
  } finally {
    state.scheduleSaveState = SaveState.Saved;
  }
}, 1000);
const checklistDebounceSave = debounce(async () => {
  state.checklistSaveState = SaveState.Saving;
  try {
    const url = `${nodeApi}/signup/checklist`;
    await fetch(url, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checklist.value),
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
    const url = `${nodeApi}/signup/text`;
    const data = {
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

const isDev = false;
const nodeApi = (isDev) ? 'http://localhost:3000' : 'https://api.nethackathon.org';
const props = defineProps<({
  currentEvent: NHEvent,
})>();

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

onMounted(async () => {
  try {
    const url = `${nodeApi}/signup`;
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
    signup.pronouns = data.pronouns;
    signup.discordUsername = data.discordUsername;
    signup.notes = data.notes;
    signup.slotLength = data.slotLength;
    signup.username = data.username;
    signup.startTime = data.startTime;
    signup.endTime = data.endTime;
    signup.nextStreamer = data.nextStreamer;
    state.loggedIn = true;
  } catch (err) {
    console.error(err)
    state.loggedIn = false;
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
  }
});

</script>

<template>
  <section class="a double login" v-if="state.loggedIn">
    <span class="login">
      <small>
        Signed in as {{ signup.username }} <a :href="`${nodeApi}/twitch/logout`">Log out</a>
      </small>
    </span>
  </section>
  <SignIn
      v-if="!state.loggedIn"
      :nodeApi="nodeApi"
      :currentEvent="props.currentEvent"
  />
  <SignUpChecklist
      v-if="state.loggedIn && !state.loading && showChecklist"
      :nextStreamer="signup.nextStreamer"
      :username="signup.username"
      :startTime="signup.startTime"
      :endTime="signup.endTime"
      v-model="checklist"
      :saveState="checklistSaveStateMessage"
  />
  <SignUpForm
      v-if="state.loggedIn && !state.loading"
      v-model="signup"
      :saveState="formSaveStateMessage"
  />
  <SignUpSchedule
      v-if="state.loggedIn && !state.loading && currentEvent.signupsOpen"
      :startDate="props.currentEvent.eventStart"
      :endDate="props.currentEvent.eventEnd"
      :schedule="schedule"
      :saveState="scheduleSaveStateMessage"
      @scheduleSlot="scheduleSlot"
  />
</template>

<style scoped>
section.login {
  padding: 0.5rem;
}

.login {
  float: right;
}
</style>
