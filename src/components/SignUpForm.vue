<template>
  <v-form ref="form">
    <v-text-field
        v-model="username"
        label="Twitch username"
        readonly
    ></v-text-field>
    <v-text-field
        v-model="discordUsername"
        label="Discord username"
        @keyup="updateText"
    ></v-text-field>
    <p><small>Join the NetHackathon discord at: <a href="https://discord.gg/QWRa8kBvkh">https://discord.gg/QWRa8kBvkh</a></small></p>
    <v-textarea
        filled
        v-model="notes"
        label="Notes"
        @keyup="updateText"
    ></v-textarea>
  </v-form>
</template>

<script lang="ts">
import { ref } from 'vue';
import { VForm, VTextField, VTextarea } from 'vuetify/components';
export default {
  components: {
    VForm,
    VTextField,
    VTextarea,
  },
  setup() {
    const username = ref('');
    const discordUsername = ref('');
    const notes = ref('');

    const updateText = () => {
      console.log(discordUsername, notes);
    };

    return {
      username,
      discordUsername,
      notes,
      updateText,
    }
  }
}

</script>
