<template>
  <div class="problem-list q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h6">
        <QIcon :name="tabCode" class="q-mr-sm" />
        Coding Problems
      </div>
      <QSpace />
      <QBtn
        v-if="isInterviewer"
        :icon="tabPlus"
        label="Add Problem"
        color="primary"
        @click="showEditor = true"
        unelevated
        dense
      />
    </div>

    <!-- Empty state -->
    <QBanner
      v-if="problems.length === 0"
      :class="dark ? 'bg-grey-9' : 'bg-grey-2'"
      class="q-mb-md"
      rounded
    >
      <template #avatar>
        <QIcon :name="tabCode" />
      </template>
      No coding problems have been added to this workspace yet.
    </QBanner>

    <!-- Problem list -->
    <QList v-else separator>
      <QItem
        v-for="problem in problems"
        :key="problem.uid"
        :class="dark ? 'bg-grey-10' : 'bg-grey-1'"
        class="q-mb-sm rounded-borders"
        clickable
        @click="$emit('select', problem)"
      >
        <QItemSection avatar>
          <QAvatar :icon="tabCode" :color="dark ? 'grey-8' : 'grey-3'" />
        </QItemSection>
        <QItemSection>
          <QItemLabel class="text-weight-medium">{{ problem.title }}</QItemLabel>
          <QItemLabel caption>
            {{ problem.language || 'No language specified' }}
          </QItemLabel>
        </QItemSection>
        <QItemSection side>
          <QChip
            v-if="getSubmissionStatus(problem.uid)"
            :color="getSubmissionStatus(problem.uid) === 'reviewed' ? 'positive' : 'warning'"
            :label="getSubmissionStatus(problem.uid) === 'reviewed' ? 'Reviewed' : 'Pending'"
            size="sm"
            dense
          />
          <QBtn
            v-if="isInterviewer"
            :icon="tabPencil"
            @click.stop="editProblem(problem)"
            flat
            round
            dense
          />
        </QItemSection>
      </QItem>
    </QList>

    <!-- Editor dialog -->
    <QDialog v-model="showEditor" persistent>
      <WorkspaceProblemEditor
        :problem="selectedProblem"
        @saved="handleSaved"
        @cancel="closeEditor"
      />
    </QDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { CodingProblem } from '../../../shared/domainModels'
import {
  tabCode,
  tabPlus,
  tabPencil,
} from 'quasar-extras-svg-icons/tabler-icons-v2'

const props = defineProps<{
  isInterviewer?: boolean
}>()

const emit = defineEmits<{
  select: [problem: CodingProblem]
}>()

const $q = useQuasar()
const dark = computed(() => $q.dark.isActive)

const workspaceStore = useWorkspaceStore()
const { workspace, candidate } = storeToRefs(workspaceStore)

const showEditor = ref(false)
const selectedProblem = ref<CodingProblem | undefined>(undefined)

const problems = computed<CodingProblem[]>(() => {
  if (!workspace.value?.problems) return []
  return Object.values(workspace.value.problems)
    .sort((a, b) => a.createdUtc.localeCompare(b.createdUtc))
})

/**
 * Get submission status for a problem
 */
function getSubmissionStatus(problemUid: string) {
  if (!candidate.value?.problemSubmissions) return null
  const submission = candidate.value.problemSubmissions[problemUid]
  return submission?.status || null
}

/**
 * Edit an existing problem
 */
function editProblem(problem: CodingProblem) {
  selectedProblem.value = problem
  showEditor.value = true
}

/**
 * Handle problem saved
 */
function handleSaved(problem: CodingProblem) {
  closeEditor()
}

/**
 * Close the editor
 */
function closeEditor() {
  showEditor.value = false
  selectedProblem.value = undefined
}
</script>

<style scoped>
.problem-list {
  height: 100%;
}
</style>
