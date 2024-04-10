<script setup lang="ts">
import { computed } from 'vue';
import { SaveState } from './_SaveState';

const props = defineProps<({
  saveState: number,
})>();

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
const saveStateMessage = computed(() => {
  return saveStateToText(props.saveState);
});
</script>

<template>
  <p class="save-state-message">{{saveStateMessage}}</p>
</template>

<style scoped>
  .save-state-message {
    float: right;
  }
</style>
