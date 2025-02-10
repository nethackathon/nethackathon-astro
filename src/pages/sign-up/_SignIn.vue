<script setup lang="ts">
  import { computed } from 'vue';
  import { eventDateString } from '../../js/shared.js';
  import { NHEvent } from '../../types/NHEvent.js';

  const props = defineProps<({
    nodeApi: String,
    currentEvent: NHEvent,
  })>();
  const signupStart = props.currentEvent.signupsStart;
  const signupEnd = props.currentEvent.signupsEnd;
  const eventStart = props.currentEvent.eventStart;
  const eventEnd = props.currentEvent.eventEnd;

  const signupsClosed = computed(() => {
    const now = new Date().toISOString();
    return (
      now < signupStart ||
      now > signupEnd
    );
  });

  const eventDate = eventDateString(eventStart, eventEnd);

  const redirectToTwitch = () => {
    location.href = `${props.nodeApi}/twitch/auth`;
  };
</script>

<template>
  <section class="a double">
    <h1>We need you <small>to stream NetHack.</small></h1>
    <p>We are looking for 24 Twitch streamers to stream NetHack for two hours
    during the weekend of {{eventDate}}.</p>
    <p>We'll be continuing the characters started by the previous streamer and
    raiding the next streamer on the schedule. There will be
    <em>many deaths</em>, and, hopefully, at least one ascension.</p>
    <h3 v-if="signupsClosed">Sign-ups are closed, but please participate in the next event!</h3>
    <p>
      <span v-if="!signupsClosed">
        <strong>Sign up today!</strong> To get started
      </span>
      <span v-if="signupsClosed">
        Streamers sign-in
      </span>
      <input type="button" class="twitch-login" @click="redirectToTwitch" value="Log In with Twitch" /></p>
  </section>
</template>

<style scoped>
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
    cursor: pointer;
  }
</style>
