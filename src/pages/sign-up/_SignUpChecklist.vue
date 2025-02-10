<script setup lang="ts">
  import {DateTime} from 'luxon';
  import {computed} from 'vue';
  import SignUpCheckItem from './_SignUpCheckItem.vue';
  import SignUpSaveState from './_SignUpSaveState.vue';
  const model = defineModel();
  const props = defineProps<({
    eventTitle: string,
    username: string,
    startTime: string,
    endTime: string,
    nextStreamer: string | null,
    saveState: number,
  })>();
  const scheduledTime = computed(() => {
    const startTime = DateTime.fromISO(props.startTime);
    const endTime = DateTime.fromISO(props.endTime);
    const startString = startTime.toLocal().toFormat("EEEE MMMM d',' h:mma");
    const endFormat = (startTime.day === endTime.day) ? "h:mma" : "EEEE MMMM d',' h:mma";
    const endString = endTime.toLocal().toFormat(endFormat);
    return `on ${startString} to ${endString}`;
  });
</script>

<template>
  <section class="c double">
    <SignUpSaveState :saveState="props.saveState" />
    <form ref="form">
      <h3>
        Thank you for signing up for the {{eventTitle}} event!
      </h3>
      <p>
        Please complete the checklist below to ensure you are ready to stream.
      </p>
      <SignUpCheckItem instructions-height="4em" v-model="model.available">
        <template #description>
          You have been scheduled to participate {{scheduledTime}}, are you available to stream during this time?
        </template>
      </SignUpCheckItem>
      <SignUpCheckItem instructions-height="5em" v-model="model.raid" v-if="props.nextStreamer && props.nextStreamer.length">
        <template #description>
          When you are done with your segment you will raid {{props.nextStreamer}} to bring your viewers to
            their channel.
        </template>
        <template #instructions>
          <p>
            In your chat type "/raid {{props.nextStreamer}}" to start the raid. After 10 seconds, click the "Raid Now"
            button in the pop up above your chat to send your viewers to their channel.
          </p>
        </template>
      </SignUpCheckItem>
      <SignUpCheckItem instructions-height="6em" v-model="model.raidPermissions" v-if="props.nextStreamer && props.nextStreamer.length">
        <template #description>
          Do you have raids turned on in your Twitch settings so the previous streamer can raid you?
        </template>
        <template #instructions>
          <p>
            Go to <a target="new" :href="`https://dashboard.twitch.tv/u/${props.username}/settings/stream`">Stream Settings</a>
            scroll down to Raids and check the "Allow raids from channels that meet the following requirements:" box,
            setting "Minimum number of viewers" to 1, and "Maximum number of viewers" to "No Maximum".
          </p>
        </template>
      </SignUpCheckItem>
      <SignUpCheckItem instructions-height="5em" v-model="model.testStream">
        <template #description>
          Have you set up OBS and done a test stream?
        </template>
        <template #instructions>
          <p>
            There are many friendly and knowledgeable people in #nethackathon-tech on the NetHackathon Discord who can
            help you get set up.
          </p>
        </template>
      </SignUpCheckItem>
      <SignUpCheckItem instructions-height="4em" v-model="model.vodPermission">
        <template #description>
          We would like to take VoDs and clips from the event and put them in a YouTube playlist and on the website, do we have your permission to post your content?
        </template>
      </SignUpCheckItem>
      <SignUpCheckItem instructions-height="6em" v-model="model.vodsOn">
        <template #description>
          (If yes) Have you turned on VoDs in Twitch so we can download your segment?
        </template>
        <template #instructions>
          <p>
            Go to <a target="new" :href="`https://dashboard.twitch.tv/u/${props.username}/settings/stream`">Stream Settings</a>
            scroll down to VOD Settings and check the "Store past broadcasts" and "Always Publish VODs" checkboxes.
            Also check "Enable Clips" so viewers and other streamers can clip highlights from your stream.
          </p>
        </template>
      </SignUpCheckItem>
      <SignUpCheckItem instructions-height="18em" v-model="model.hardfoughtAccount">
        <template #description>
          We are going to play NetHack on the hardfought.org server, do you have a Hardfought account?
        </template>
        <template #instructions>
          <p>
            Start up the terminal of your choice (for Windows users, a very popular choice is PuTTY), and connect (ssh)
            to the closest Hardfought server: nethack@hardfought.org (US server, east coast), nethack@eu.hardfought.org
            (EU server, London), or nethack@au.hardfought.org (AU server, Sydney), for instance, to connect to the US
            server type "ssh nethack@hardfought.org" in your terminal.
          </p>
          <p>
            Once you've connected to your preferred server type "r" to select the "Register new user" menu item and
            follow the instructions to create a new user.
          </p>
          <p>
            If you need any help with SSH, or Hardfought, please ask the friendly and knowledgeable people in the
            #nethackathon-tech channel on the NetHackathon Discord.
          </p>
        </template>
      </SignUpCheckItem>
      <SignUpCheckItem instructions-height="8em" v-model="model.nethackrc">
        <template #description>
          Have you set up and tested your NetHack configuration (nethackrc) for NetHack 3.7 on Hardfought?
        </template>
        <template #instructions>
          <p>
            Log into your chosen Hardfought server and type "j" to select "Manage settings" then "v" to select
            "NetHack 3.7.0-hdf" and edit your config there. You can also go to Hardfought's
            <a target="new" href="https://www.hardfought.org/nethack/rcedit/rcedit-nethack/">web-based nethackrc editor</a>
            (which can be easier for copying and pasting into).
          </p>
        </template>
      </SignUpCheckItem>
      <SignUpCheckItem instructions-height="8em" v-model="model.sharedLogin">
        <template #description>
          We will be logging into a shared `nethackathon` account and using a special NetHackathon build of
          NetHack for the tournament, have you tested logging in with the shared account?
        </template>
        <template #instructions>
          <p>
            Log into your preferred hardfought server, press `l` to Login, and provide the username `nethackathon` and
            the password `purple_worm` when prompted.
          </p>
          <p>
            At the main menu, press `N` to choose the "Tournament (NetHackathon)" option.
          </p>
        </template>
      </SignUpCheckItem>
      <SignUpCheckItem instructions-height="24em" v-model="model.copyrc">
        <template #description>
          At the start of your assigned slot, you will want to copy your NetHack configuration (nethackrc) from
          the "NetHack 3.7.0-hdf" nethackrc that you have already configured and tested. Have you practiced copying your
          config from your account to the "nethackathon" account?
        </template>
        <template #instructions>
          <p>
            After logging into hardfought using the "nethackathon" account, press `N` to select "Tournament (NetHackathon)"
            and then `j` to select "Copy another config to nethackathon".
          </p>
          <ol>
            <li>
              Press `a`, `e`, or `u` to select the server (AU, EU, and US respectively) you tested your configuration on.
            </li>
            <li>
              Press `p` to "Choose another player" and type in the username of your hardfought account. <em>The username is case sensitive.</em>
            </li>
            <li>
              Press `v` to "Choose another variant" and press `v` to choose "NetHack 3.7.0-hdf"
            </li>
            <li>
              Press `d` to "Do it!"
            </li>
          </ol>
          <p>
            After completing those four steps, the nethackathon account will have the same NetHack configuration as the
            one you tested. <em>Because each streamer will be copying their configuration over, you will have to do this
            at the beginning of your segment.</em>
          </p>
        </template>
      </SignUpCheckItem>
      <p>(Optional) We are going to collect money for a charity during the event, please suggest a charity for us to donate to and we'll pick one at random from the suggestions.</p>
      <p>
        <input style="width: 100%;" v-model="model.suggestedCharity" type="text" placeholder="Charity name and website">
      </p>
      <SignUpCheckItem instructions-height="4em" v-model="model.rememberToSave">
        <template #description>
          <em>Don't forget to Save!</em>
        </template>
      </SignUpCheckItem>
    </form>
  </section>
</template>

<style scoped>
  input {
    font-family: "DejaVu Sans Mono", "Menlo", sans-serif;
    font-size: 15pt;
  }
  .save-state-message {
    float: right;
  }
</style>
