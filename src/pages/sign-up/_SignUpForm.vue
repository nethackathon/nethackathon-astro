<script setup lang="ts">
  import { ref } from 'vue';

  const model = defineModel();

  const props = defineProps({
    saveState: String,
  });

  const slotLengths = ref([
    "2 hours",
    "3 hours",
    "4 hours"
  ]);
</script>

<template>
  <section class="c double">
    <p class="save-state-message">{{saveState}}</p>
    <p>
      Fill out the form to sign up, the form is saved automatically.
    </p>
    <p>
      We organize the event using Discord. Join the NetHackathon Discord server
      at: <a href="https://discord.gg/PERAP8caeS">https://discord.gg/PERAP8caeS</a>
      and introduce yourself!
    </p>
    <form ref="form">
      <p>
        <label for="slotLength">Maximum slot length (most streamers will be assigned a 2 hours slot):</label><br>
        <select
          id="slotLength"
          v-model="model.slotLength"
          :items="slotLengths"
        >
          <option disabled value="">Please select one</option>
          <option v-for="slotLength  in slotLengths" :value="slotLength">{{slotLength}}</option>
        </select>
      </p>

      <p>
        <label for="pronouns">Preferred pronouns (e.g. they/them/their):</label><br>
        <input
          type="text"
          id="pronouns"
          v-model="model.pronouns"
        ></input>
      </p>

      <p>
        <label for="discordUsername">Discord username:</label><br>
        <input
          type="text"
          id="discordUsername"
          v-model="model.discordUsername"
        ></input>
      </p>

      <p>
        <label for="notes">Notes:</label><br>
        <textarea
          id="notes"
          rows="5"
          cols="50"
          v-model="model.notes"
        ></textarea>
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
