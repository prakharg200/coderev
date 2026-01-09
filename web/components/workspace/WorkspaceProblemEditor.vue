<template>
  <QCard class="problem-editor q-pa-md" :class="dark ? 'bg-grey-9' : 'bg-white'">
    <QCardSection>
      <div class="text-h6 q-mb-md">
        <QIcon :name="tabFilePencil" class="q-mr-sm" />
        {{ isEditing ? 'Edit Problem' : 'Create Problem' }}
      </div>

      <QForm @submit.prevent="saveProblem" class="column q-gutter-md">
        <!-- Title -->
        <QInput
          v-model="problemForm.title"
          label="Problem Title *"
          :rules="[val => !!val || 'Title is required']"
          :class="dark ? 'bg-grey-10' : 'bg-grey-1'"
          outlined
          dense
        />

        <!-- Description (Markdown) -->
        <QInput
          v-model="problemForm.description"
          label="Problem Description (Markdown) *"
          type="textarea"
          :rules="[val => !!val || 'Description is required']"
          :class="dark ? 'bg-grey-10' : 'bg-grey-1'"
          hint="Use markdown for formatting"
          outlined
          autogrow
        />

        <!-- Language Selection -->
        <QSelect
          v-model="problemForm.language"
          :options="languageOptions"
          label="Programming Language"
          :class="dark ? 'bg-grey-10' : 'bg-grey-1'"
          emit-value
          map-options
          outlined
          dense
        />

        <!-- Starter Code -->
        <QInput
          v-model="problemForm.starterCode"
          label="Starter Code (Optional)"
          type="textarea"
          :class="dark ? 'bg-grey-10' : 'bg-grey-1'"
          hint="Provide starter code for candidates"
          outlined
          autogrow
        />

        <!-- Action buttons -->
        <div class="row q-gutter-sm justify-end">
          <QBtn
            label="Cancel"
            :icon="tabX"
            @click="$emit('cancel')"
            flat
          />
          <QBtn
            type="submit"
            label="Save Problem"
            :icon="tabDeviceFloppy"
            color="primary"
            :loading="saving"
            unelevated
          />
        </div>
      </QForm>
    </QCardSection>
  </QCard>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { CodingProblem } from '../../../shared/domainModels'
import {
  tabFilePencil,
  tabDeviceFloppy,
  tabX,
} from 'quasar-extras-svg-icons/tabler-icons-v2'

const props = defineProps<{
  problem?: CodingProblem // For editing existing problems
}>()

const emit = defineEmits<{
  cancel: []
  saved: [problem: CodingProblem]
}>()

const $q = useQuasar()
const dark = computed(() => $q.dark.isActive)

const dayjs = useDayjs()

const { profile } = storeToRefs(useAppStore())

const workspaceStore = useWorkspaceStore()
const { workspace } = storeToRefs(workspaceStore)

const saving = ref(false)

const isEditing = computed(() => !!props.problem?.uid)

const languageOptions = [
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'C#', value: 'csharp' },
  { label: 'C++', value: 'cpp' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' },
  { label: 'Ruby', value: 'ruby' },
  { label: 'PHP', value: 'php' },
  { label: 'Other', value: 'other' },
]

const problemForm = reactive({
  title: props.problem?.title ?? '',
  description: props.problem?.description ?? '',
  language: props.problem?.language ?? 'javascript',
  starterCode: props.problem?.starterCode ?? '',
})

/**
 * Save the problem to the workspace
 */
async function saveProblem() {
  if (!workspace.value || !profile.value) {
    return
  }

  saving.value = true

  try {
    const problemUid = props.problem?.uid ?? nanoid(8)
    
    const problem: CodingProblem = {
      uid: problemUid,
      title: problemForm.title,
      description: problemForm.description,
      language: problemForm.language,
      starterCode: problemForm.starterCode || undefined,
      createdUtc: props.problem?.createdUtc ?? dayjs().utc().toISOString(),
      createdBy: props.problem?.createdBy ?? profile.value.uid,
    }

    // Save to Firestore
    await workspaceRepository.updateFields(workspace.value.uid, {
      [`problems.${problemUid}`]: problem,
    })

    // Update local state
    if (!workspace.value.problems) {
      workspace.value.problems = {}
    }
    workspace.value.problems[problemUid] = problem

    $q.notify({
      type: 'positive',
      message: isEditing.value ? 'Problem updated!' : 'Problem created!',
      timeout: 2000,
      position: 'bottom-right',
    })

    emit('saved', problem)
  } catch (e) {
    console.error(e)
    $q.notify({
      type: 'negative',
      message: 'Failed to save problem',
      timeout: 3000,
      position: 'bottom-right',
    })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.problem-editor {
  max-width: 600px;
  width: 100%;
}
</style>
