import { ref } from "vue";

export type Checklist = {
  available?: boolean;
  testStream?: boolean;
  vodPermission?: boolean;
  vodsOn?: boolean;
  hardfoughtAccount?: boolean;
  nethackrc?: boolean;
  sharedLogin?: boolean;
  copyrc?: boolean;
  suggestedCharity?: string;
  rememberToSave?: boolean;
}

export type DBParticipant = {
  username: string;
  checklist: string | null;
  signed_up: 0 | 1;
  schedule_length: number;
  pronouns: string;
  discord_username: string;
  slot_length: '2 hours' | '3 hours' | '4 hours';
  notes: string;
}

export type Participant = {
  username: string;
  discord_username: string;
  pronouns: string;
  confirmed_time: boolean;
  charity_selected: boolean;
  charity: string;
  checklist_progress: number;
  notes: string;
  slot_length: '2 hours' | '3 hours' | '4 hours';
  schedule_length: number;
}

export function useParticipantService(nodeApi: string) {
  const participants = ref<Participant[]>([]);
  const loadingParticipants = ref(false);

  async function fetchParticipants(eventId: number) {
    try {
      loadingParticipants.value = true;
      const response = await fetch(`${nodeApi}/event/${eventId}/participants`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      const dbParticipants: DBParticipant[] = data.participants;
      participants.value = dbParticipants.map(participantMapper);
    } catch (error) {
      console.error('Failed to fetch participants:', error);
    } finally {
      loadingParticipants.value = false;
    }
  }

  const participantMapper = (dbParticipant: DBParticipant, index: number, arr: DBParticipant[]): Participant => {
    const checklist: Checklist = dbParticipant.checklist ? JSON.parse(dbParticipant.checklist) : {};
    return {
      username: dbParticipant.username,
      discord_username: dbParticipant.discord_username,
      pronouns: dbParticipant.pronouns,
      confirmed_time: checklist.available ?? false,
      charity_selected: (checklist.suggestedCharity) ? (checklist.suggestedCharity.length > 0) : false,
      checklist_progress: Object.keys(checklist)
        .filter(key => typeof checklist[key as keyof Checklist] === 'boolean' && checklist[key as keyof Checklist] === true)
        .length,
      notes: dbParticipant.notes,
      slot_length: dbParticipant.slot_length,
      schedule_length: dbParticipant.schedule_length,
      charity: checklist.suggestedCharity ?? '',
    }
  }

  return {
    participants,
    loadingParticipants,
    fetchParticipants,
  }
}