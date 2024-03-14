<script setup lang="ts">
  import { computed, onMounted, reactive, ref, watch } from 'vue';
  import SignIn from './_SignIn.vue';
  import SignUpForm from './_SignUpForm.vue';
  import SignUpSchedule from './_SignUpSchedule.vue';
  import _ from 'lodash';

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
  });
    
  const saveStateToText = (saveState) => {
    switch(saveState) {
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
  const formSaveStateMessage = computed(() => {
    return saveStateToText(state.formSaveState);
  });
  const scheduleSaveStateMessage = computed(() => {
    return saveStateToText(state.scheduleSaveState);
  });

  const signup = reactive({
    pronouns: '',
    discordUsername: '',
    notes: '',
    slotLength: '',
    username: ''
  });

  const schedule = ref({});

  const scheduleDebounceSave = _.debounce(async () => {
    state.scheduleSaveState = SaveState.Saving;
    try {
      const url = `${props.nodeApi}/signup/schedule`;
      const response = await fetch(url, {
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
  const formDebounceSave = _.debounce(async () => {
    state.formSaveState = SaveState.Saving;
    try {
      const url = `${props.nodeApi}/signup/text`;
      const data = {
        discordUsername: signup.discordUsername,
        notes: signup.notes,
        pronouns: signup.pronouns,
        slotLength: signup.slotLength,
      };
      const response = await fetch(url, {
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

  const props = defineProps({
    nodeApi: String,
    currentEvent: Object, 
  });

  const redirectToTwitch = () => {
    location.href = `${props.nodeApi}/twitch/auth`;
  };
  
  const scheduleSlot = (slot) => {
    console.log('scheduleSlot', slot);
    const start = slot.start.ts;
    const modifiedSchedule = { ...schedule.value };
    if (Object.prototype.hasOwnProperty.call(modifiedSchedule, start)) {
      modifiedSchedule[slot.start.ts] = (modifiedSchedule[start] + 1) % 3;
    } else {
      modifiedSchedule[start] = 1;
    }
    schedule.value = modifiedSchedule;
    console.log('modifiedSchedule', modifiedSchedule);
  };

  onMounted(async () => {
    try {
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
      signup.pronouns = data.pronouns;
      signup.discordUsername = data.discordUsername;
      signup.notes = data.notes;
      signup.slotLength = data.slotLength;
      signup.username = data.username;
      state.loggedIn = true;
    } catch (err) {
      console.error(err)
      state.loggedIn = false;
    } finally {
      state.loading = false;
      watch(signup, (changedSignup) => {
        state.formSaveState = SaveState.Unsaved;
        formDebounceSave();
      });
      watch(schedule, (changedSchedule) => {
        state.scheduleSaveState = SaveState.Unsaved;
        scheduleDebounceSave();
      }, { deep: true });
    }
  });

</script>

<template>
  <section class="a double login" v-if="state.loggedIn">
    <span class="login">
      <small>
        Signed in as {{signup.username}} <a :href="`${props.nodeApi}/twitch/logout`">Log out</a>
      </small>
    </span>
  </section>
  <SignIn
    v-if="!state.loggedIn"
    :nodeApi="props.nodeApi"
    :currentEvent="props.currentEvent"
  />
  <SignUpForm
    v-if="state.loggedIn && !state.loading"
    v-model="signup"
    :saveState="formSaveStateMessage"
  />
  <SignUpSchedule
    v-if="state.loggedIn && !state.loading"
    :startDate="currentEvent.event_start"
    :endDate="currentEvent.event_end"
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

  .twitch-login {
    background-color: rgb(145, 71, 255);
    color: white !important;
    border-radius: 4px;
    font-size: 13pt;
    padding: .5em;
    margin: .5em;
    font-family: Inter, Roobert, "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-weight: 600;
    font-stretch: 100%;
  }
</style>
