<template>
  <div class="workspace-right-panel column full-height" :class="panelClass">
    <!-- Tab Header -->
    <QTabs
      v-model="activeTab"
      class="col-shrink"
      :class="dark ? 'bg-grey-9 text-grey-4' : 'bg-grey-2 text-grey-8'"
      active-color="primary"
      indicator-color="primary"
      narrow-indicator
      dense
    >
      <QTab name="comments" :icon="tabMessageDots" label="Comments" />
      <QTab name="problems" :icon="tabCode" label="Problems" />
      <QTab name="ai" :icon="tabMessageChatbot" label="AI Assistant" />
    </QTabs>

    <QSeparator />

    <!-- Tab Panels -->
    <QTabPanels
      v-model="activeTab"
      class="col bg-transparent"
      animated
      keep-alive
    >
      <QTabPanel name="comments" class="q-pa-none full-height">
        <WorkspaceComments />
      </QTabPanel>

      <QTabPanel name="problems" class="q-pa-none full-height">
        <WorkspaceProblemView
          v-if="selectedProblem"
          :problem="selectedProblem"
          :is-interviewer="isInterviewer"
          @back="selectedProblem = undefined"
        />
        <WorkspaceProblemList
          v-else
          :is-interviewer="isInterviewer"
          @select="selectedProblem = $event"
        />
      </QTabPanel>

      <QTabPanel name="ai" class="q-pa-none full-height">
        <WorkspaceAiChatPanelEmbedded
          :selected-source-file="selectedSourceFile"
          :selection="selection"
        />
      </QTabPanel>
    </QTabPanels>
  </div>
</template>

<script setup lang="ts">
import type { CodingProblem } from '../../../shared/domainModels'
import {
  tabMessageDots,
  tabMessageChatbot,
  tabCode,
} from "quasar-extras-svg-icons/tabler-icons-v2";

const $q = useQuasar();
const route = useRoute();

const dark = computed(() => $q.dark.isActive);

const workspaceStore = useWorkspaceStore();
const { selectedSourceFile, selection } = storeToRefs(workspaceStore);

// Active tab state - default to comments
const activeTab = ref<"comments" | "problems" | "ai">("comments");

// Selected problem for viewing
const selectedProblem = ref<CodingProblem | undefined>(undefined);

// Check if user is interviewer (not in review mode)
const isInterviewer = computed(() => !route.fullPath.includes("/review/"));

const panelClass = computed(() => ({
  "bg-grey-10 text-white": dark.value,
  "bg-white text-black": !dark.value,
}));
</script>

<style scoped>
.workspace-right-panel {
  height: 100%;
  overflow: hidden;
}

:deep(.q-tab-panel) {
  height: 100%;
  overflow: hidden;
}

:deep(.q-tab-panels) {
  height: 100%;
}
</style>

