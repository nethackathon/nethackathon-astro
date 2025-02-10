<script setup lang="ts">
  import { ref } from 'vue';
  import SignUpSaveState from "./_SignUpSaveState.vue";
  import SignUpCheckItem from './_SignUpCheckItem.vue';

  const model = defineModel();

  const props = defineProps<({
    saveState: number,
  })>();

  const slotLengths = ref([
    "2 hours",
    "3 hours",
    "4 hours"
  ]);
</script>

<template>
  <section class="c double">
    <SignUpSaveState :saveState="props.saveState" />
    <h3>Sign Up</h3>
    <p>
      There are three steps to sign up for the event:
    </p>
    <ol>
      <li>Fill out the short form below, the form is saved automatically.</li>
      <li>Click the <a href="#/availability">Availability</a> link above and select all time slots during the weekend where you are available to
        stream.</li>
      <li>
        Join the NetHackathon Discord server at:
        <a href="https://discord.gg/PERAP8caeS">https://discord.gg/PERAP8caeS</a> and introduce yourself!
      </li>
    </ol>
    <form ref="form">
      <p>
      <SignUpCheckItem instructions-height="4em" v-model="model.signedUp">
        <template #description>
          YES! I want to participate in this event.
            <small>You will not be assigned a slot in the event if this checkbox is not checked.
            You can change this preference at any point until the event is scheduled.</small>
        </template>
      </SignUpCheckItem>
      </p>
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
