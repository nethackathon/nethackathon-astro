<script setup lang="ts">
  import { onMounted, reactive } from 'vue';
  import SignIn from './_SignIn.vue';

  const state = reactive({
    loggedIn: false, 
    loading: true,
  });

  const signup: Ref<Signup> = reactive({
    pronouns: '',
    schedule: {},
    discordUsername: '',
    notes: '',
    slotLength: '',
    username: ''
  });

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
    }
  });
</script>

<template>
  <section class="a double">
    <span class="login" v-if="state.loggedIn">
      <small>
        Signed in as {{signup.username}} <a :href="`${props.nodeApi}/twitch/logout`">Log out</a>
      </small>
    </span>
  </section>
  <SignIn
    :nodeApi = "props.nodeApi"
    :currentEvent = "props.currentEvent"
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
