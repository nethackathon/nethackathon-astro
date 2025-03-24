<script setup lang="ts">

import type { NHEvent } from './_interfaces/NHEvent';
import type { Participant } from './_services/participant.service';
import { computed, reactive, ref, watch } from 'vue';
import { useCharityService } from './_services/charity.service';

const props = defineProps<({
  loading: boolean,
  nodeApi: string,
  selectedEvent: NHEvent | null,
  participants: Participant[] | null,
})>();

const emit = defineEmits<{
  (e: 'charity-selected'): void
}>();

const participants = computed(() => props.participants);
const selectedEvent = computed(() => props.selectedEvent);

const editableCharity = reactive({
  charity_name: '',
  charity_description: '',
  charity_url: '',
  giving_url: '',
  api_endpoint: ''
});

const savingCharity = ref(false);

const saveCharityChanges = async () => {
  savingCharity.value = true;
  await saveCharity(editableCharity);
  savingCharity.value = false;
}

async function selectCharity() {
  await serviceSelectCharity();
  emit('charity-selected');
}

const {
  candidateCharities,
  chosenCharity,
  charitySelected,
  loadingCharities,
  selectCharity: serviceSelectCharity,
  saveCharity,
} = useCharityService(props.nodeApi, participants, selectedEvent);

watch(() => chosenCharity.value, (newCharity) => {
  if (newCharity) {
    editableCharity.charity_name = newCharity.charity_name || '';
    editableCharity.charity_description = newCharity.charity_description || '';
    editableCharity.charity_url = newCharity.charity_url || '';
    editableCharity.giving_url = newCharity.giving_url || '';
    editableCharity.api_endpoint = newCharity.api_endpoint || '';
  }
}, { immediate: true });

</script>

<template>
  <section class="c double admin-charity">
    <div class="header">
      <h2>Charity</h2>
    </div>
    <div v-if="loadingCharities">
      <p>Loading charities...</p>
    </div>
    <div v-else-if="charitySelected">
      <h3>Chosen Charity</h3>
      <form @submit.prevent="saveCharityChanges">
        <div class="form-group">
          <label for="charity-name">Name:</label>
          <input 
            id="charity-name"
            type="text" 
            v-model="editableCharity.charity_name" 
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label for="charity-description">Description:</label><br>
          <textarea 
            id="charity-description"
            v-model="editableCharity.charity_description" 
            rows="4"
            class="form-textarea"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="charity-url">Website:</label>
          <input 
            id="charity-url"
            type="url" 
            v-model="editableCharity.charity_url" 
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label for="giving-url">Dontation Link:</label>
          <input 
            id="giving-url"
            type="url" 
            v-model="editableCharity.giving_url" 
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label for="api-endpoint">API Endpoint:</label>
          <input 
            id="api-endpoint"
            type="text" 
            v-model="editableCharity.api_endpoint" 
            class="form-input"
          />
        </div>
        
        <div class="form-actions">
          <button 
            type="submit" 
            class="button save-button"
            :disabled="savingCharity"
          >
            {{ savingCharity ? 'Saving...' : 'Save Charity Information' }}
          </button>
        </div>
      </form>
    </div>
    <div v-else>
      <h3>Candidate Charities</h3>
      <ul>
        <li v-for="charity in candidateCharities" :key="charity">
          {{ charity }}
        </li>
      </ul>
      <button class="button" @click="selectCharity">Select Random Charity!</button>
    </div>
  </section>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.button {
  font-size: large;
  padding: 0.25rem 0.5rem;
  margin: 1rem 0;
  border-radius: 4px;
  background-color: var(--color-b);
  color: white;
  border: none;
  cursor: pointer;
}

.form-group {
  margin-bottom: 1rem;
  display: flex;
  flex-wrap: wrap;
}

.form-group label {
  flex: 0 0 12rem;
  padding-right: 1rem;
  margin-bottom: 0;
}

.form-group .form-input,
.form-group .form-textarea {
  flex: 1 1 300px;
}
</style>