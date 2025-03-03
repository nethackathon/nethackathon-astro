<script setup lang="ts">
  import { ref } from 'vue';

  const model = defineModel();
  const props = defineProps<{
    instructionsHeight?: String,
  }>();

  const showInstructions = ref(false);
  const toggleInstructions = () => {
    showInstructions.value = !showInstructions.value;
  };
  const checkItem = () => {
    model.value = !model.value;
  };
</script>

<template>
  <p class="description-container" @click="checkItem"><span class="checkbox">{{(model) ? '✅' : '⬜'}}</span><slot name="description"></slot></p>
  <div v-if="$slots.instructions">
    <span @click="toggleInstructions" class="toggle-instructions"><span class="caret" :class="{ 'rotate-down': showInstructions }">&#x25B6;</span>How do I do this?</span>
    <p :style="{ height: showInstructions ? props.instructionsHeight : '0px' }" class="instructions-container"><slot name="instructions"></slot></p>
  </div>
</template>

<style scoped>
  .toggle-instructions, .description-container {
    cursor: pointer;
  }

  .checkbox {
    padding-right: 0.5em;
  }

  .caret {
    padding-right: 0.5em;
    display: inline-block;
    transition: transform 0.3s ease;
  }

  .caret.rotate-down {
    transform: rotate(90deg);
  }

  .instructions-container {
    margin-block-start: 0.2em;
    transition: height 0.3s ease;
    overflow: hidden;
  }
</style>
