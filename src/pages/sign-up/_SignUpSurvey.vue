<script setup lang="ts">
  import SignUpSaveState from "./_SignUpSaveState.vue";

  const model = defineModel();

  const props = defineProps<({
    saveState: number,
  })>();

</script>

<template>
  <section class="c double">
    <SignUpSaveState :saveState="props.saveState" />
    <p>
      Thank you so much for participating in the Spring 2024 NetHackathon! We couldn't do it without you. To make the
      next event the best possible, please fill out this survey.
    </p>
    <form>
      <p>
        <label for="rumors">Do you have any rumors/graffiti we can add to the NetHackathon build?</label><br>
        <textarea
          id="rumors"
          v-model="model.rumors"
          rows = "3"
          cols = "50"
        />
      </p>
      <p>
        <label for="tshirt">Do you have any t-shirt messages we can add to the NetHackathon build?</label><br>
        <textarea
            id="tshirt"
            v-model="model.tshirt"
            rows = "3"
            cols = "50"
        />
      </p>
      <p>
        <label for="tshirt">What about gravestone messages? Any interesting deaths we can memorialize on gravestones?</label><br>
        <textarea
            id="gravestone"
            v-model="model.gravestone"
            rows = "3"
            cols = "50"
        />
      </p>
      <p>
        <label for="notes">What went well this event? What could have gone better? How can we improve the event for next time?</label><br>
        <textarea
            id="notes"
            v-model="model.notes"
            rows = "6"
            cols = "50"
        />
      </p>
      <p>
        <label for="contactPermission">Check this box if we have permission to contact you to remind you about the next event.</label><br>
        <p class="description-container" @click="model.contactPermission = !model.contactPermission">
          <span class="checkbox">{{(model.contactPermission) ? '✅' : '❎'}}</span><slot name="description"></slot>
        </p>
      </p>
      <p>
        <label for="contact">(If yes) What is your preferred method of contact (e.g. discord, email, irc, carrier pigeon)? Put your contact details here (I promise I will only use this to remind you about NetHackathon events.)</label><br>
        <textarea
            id="contact"
            v-model="model.contact"
            rows = "3"
            cols = "50"
        />
      </p>
    </form>
  </section>
</template>

<style scoped>
  .save-state-message {
    float: right;
  }
  input, textarea, select {
    font-family: "DejaVu Sans Mono", "Menlo", sans-serif;
    font-size: 15pt;
  }
</style>
