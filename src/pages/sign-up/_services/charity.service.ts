import { computed, ref, type ComputedRef } from 'vue';
import type { Participant } from './participant.service';
import type { NHEvent } from '../_interfaces/NHEvent';

export type Charity = {
  charity_name?: string;
  charity_description?: string;
  charity_url?: string;
  giving_url?: string;
  api_endpoint?: string;
}

export function useCharityService(
  nodeApi: string,
  participants: ComputedRef<Participant[] | null>,
  event: ComputedRef<NHEvent | null>,
) {
  const candidateCharities = computed(() => {
    if (!participants.value) {
      return [];
    }
    return participants.value?.map(p => p.charity).filter(n => (n ?? '').length > 0);
  });

  const chosenCharity = computed(() => {
    if (!event) {
      return null;
    }
    return {
      charity_name: event.value?.charity_name,
      charity_description: event.value?.charity_description,
      charity_url: event.value?.charity_url,
      giving_url: event.value?.giving_url,
      api_endpoint: event.value?.api_endpoint,
    };
  });

  const loadingCharities = ref(false);
  const charitySelected = computed(() => {
    return (event.value?.charity_name ?? '').length > 0;
  });

  async function selectCharity() {
    if (!event) {
      return;
    }
    const randomCharity = candidateCharities.value[Math.floor(Math.random() * candidateCharities.value.length)];
    const charity = {
      charity_name: randomCharity,
      charity_description: '',
      charity_url: '',
      giving_url: '',
      api_endpoint: '',
    };
    await updateCharity(charity);
  }

  async function saveCharity(charity: Charity) {
    if (!event.value) {
      return;
    }
    await updateCharity(charity);
  }

  async function updateCharity(charity: Charity) {
    if (!event.value) {
      return;
    }
    const response = await fetch(`${nodeApi}/event/${event.value.id}/charity`, {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'PUT',
      credentials: 'include',
      body: JSON.stringify(charity),
    });
    const data = await response.json();
    console.log(data);
  }

  return {
    candidateCharities,
    chosenCharity,
    charitySelected,
    loadingCharities,
    selectCharity,
    saveCharity,
  }
}