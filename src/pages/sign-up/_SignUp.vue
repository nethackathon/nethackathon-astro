<script setup lang="ts">
  import { computed, onMounted, reactive, watch } from 'vue';
  import SignIn from './_SignIn.vue';
  import SignUpForm from './_SignUpForm.vue';
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
    saveState: SaveState.Saved,
  });
    
  const saveStateMessage = computed(() => {
    switch(state.saveState) {
      case SaveState.Saved:
        return 'Saved ✅︎';
      case SaveState.Unsaved:
        return 'Unsaved 🟡';
      case SaveState.Saving:
        return 'Saving 🔄';
      default:
        return 'Error 🛑';
    }
  });

  const signup = reactive({
    pronouns: '',
    schedule: {},
    discordUsername: '',
    notes: '',
    slotLength: '',
    username: ''
  });

  const debounceSave = _.debounce(async () => {
    state.saveState = SaveState.Saving;
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
      console.log(error);
      state.saveState = SaveState.Error;
    } finally {
      state.saveState = SaveState.Saved;
    }
  }, 1000);

  const props = defineProps({
    nodeApi: String,
    currentEvent: Object, 
  });

  const redirectToTwitch = () => {
    location.href = `${props.nodeApi}/twitch/auth`;
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
      console.log('data', data);
      signup.pronouns = data.pronouns;
      signup.schedule = JSON.parse(data.schedule);
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
        state.saveState = SaveState.Unsaved;
        debounceSave();
      });
    }
  });

</script>

<template>
  <section class="a double" v-if="state.loggedIn">
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
    :saveState="saveStateMessage"
  />
</template>

<style scoped>
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
