<template>
  <div class="problems-panel q-pa-md" :class="dark ? 'bg-dark' : 'bg-grey-2'">
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <div class="text-h5">
        <QIcon :name="tabCode" class="q-mr-sm" />
        Coding Problems
      </div>
      <QSpace />
      <QBtn
        :icon="tabPlus"
        label="Add Problem"
        color="primary"
        @click="showEditor = true"
        unelevated
      />
    </div>

    <QSeparator class="q-mb-md" />

    <QBanner
      v-if="problems.length === 0"
      :class="dark ? 'bg-grey-9' : 'bg-grey-3'"
      class="q-mb-md"
      rounded
    >
      <template #avatar>
        <QIcon :name="tabCode" size="xl" />
      </template>
      <div class="text-body1">No coding problems yet</div>
      <div class="text-body2 text-grey-6">
        Create coding problems that candidates can solve during their review.
      </div>
    </QBanner>

    <!-- Problem list (use simple div instead of QScrollArea to avoid height issues) -->
    <div v-if="problems.length > 0" class="problems-list">
      <QList>
        <QExpansionItem
          v-for="problem in problems"
          :key="problem.uid"
          :class="dark ? 'bg-grey-10' : 'bg-white'"
          class="q-mb-sm rounded-borders"
          expand-separator
          :header-class="dark ? 'bg-grey-10' : 'bg-white'"
        >
          <template #header>
            <QItemSection avatar>
              <QAvatar
                :icon="tabCode"
                :color="dark ? 'grey-8' : 'grey-3'"
                :text-color="dark ? 'white' : 'grey-8'"
              />
            </QItemSection>
            <QItemSection>
              <QItemLabel class="text-weight-medium text-h6">{{ problem.title }}</QItemLabel>
              <QItemLabel caption lines="2">
                {{ problem.description.substring(0, 100) }}{{ problem.description.length > 100 ? '...' : '' }}
              </QItemLabel>
              <QItemLabel class="q-mt-sm">
                <QChip
                  v-if="problem.language"
                  :label="problem.language"
                  size="sm"
                  color="primary"
                  text-color="white"
                  dense
                />
                <QChip
                  :label="`${getSubmissionsForProblem(problem.uid).length} submissions`"
                  size="sm"
                  :color="getSubmissionsForProblem(problem.uid).length > 0 ? 'positive' : 'grey'"
                  text-color="white"
                  dense
                  class="q-ml-sm"
                />
              </QItemLabel>
            </QItemSection>
            <QItemSection side>
              <div class="row q-gutter-sm" @click.stop>
                <QBtn
                  :icon="tabEye"
                  @click.stop="viewProblem(problem)"
                  flat
                  round
                  dense
                >
                  <QTooltip>View problem</QTooltip>
                </QBtn>
                <QBtn
                  :icon="tabPencil"
                  @click.stop="editProblem(problem)"
                  flat
                  round
                  dense
                >
                  <QTooltip>Edit problem</QTooltip>
                </QBtn>
                <QBtn
                  :icon="tabTrash"
                  color="negative"
                  @click.stop="deleteProblem(problem)"
                  flat
                  round
                  dense
                >
                  <QTooltip>Delete problem</QTooltip>
                </QBtn>
              </div>
            </QItemSection>
          </template>

          <!-- Candidate Solutions Section -->
          <QCard flat :class="dark ? 'bg-grey-9' : 'bg-grey-1'">
            <QCardSection class="q-pa-sm">
              <div class="text-subtitle2 q-mb-sm">
                <QIcon :name="tabUsers" class="q-mr-xs" />
                Candidate Solutions
              </div>
              
              <div v-if="getSubmissionsForProblem(problem.uid).length === 0" class="text-grey q-pa-md text-center">
                No submissions yet
              </div>
              
              <QList v-else dense separator>
                <QItem
                  v-for="submission in getSubmissionsForProblem(problem.uid)"
                  :key="submission.candidateUid"
                  :class="dark ? 'bg-grey-10' : 'bg-white'"
                  class="rounded-borders q-mb-xs"
                >
                  <QItemSection avatar>
                    <QAvatar :icon="tabUser" :color="dark ? 'grey-7' : 'grey-4'" size="sm" />
                  </QItemSection>
                  <QItemSection>
                    <QItemLabel>{{ getCandidateEmail(submission.candidateUid) }}</QItemLabel>
                    <QItemLabel caption>
                      Submitted {{ formatDate(submission.submittedUtc) }}
                    </QItemLabel>
                  </QItemSection>
                  <QItemSection side>
                    <div class="row items-center q-gutter-sm">
                      <!-- Star Rating -->
                      <QRating
                        :model-value="submission.rating || 0"
                        @update:model-value="(val) => rateSubmission(submission, val)"
                        :max="5"
                        size="sm"
                        color="yellow-8"
                        icon="star_border"
                        icon-selected="star"
                        icon-half="star_half"
                      />
                      <QBtn
                        :icon="tabCode"
                        size="sm"
                        flat
                        round
                        dense
                        @click="viewSubmission(submission, problem)"
                      >
                        <QTooltip>View code</QTooltip>
                      </QBtn>
                    </div>
                  </QItemSection>
                </QItem>
              </QList>
            </QCardSection>
          </QCard>
        </QExpansionItem>
      </QList>
    </div>

    <!-- Problem Editor Dialog -->
    <QDialog v-model="showEditor" persistent>
      <QCard style="width: 700px; max-width: 90vw; max-height: 90vh;" class="column" :class="dark ? 'bg-grey-10' : 'bg-white'">
        <QCardSection class="row items-center col-shrink">
          <div class="text-h5">
            {{ selectedProblem ? 'Edit Problem' : 'Create Problem' }}
          </div>
          <QSpace />
          <QBtn :icon="tabX" @click="closeEditor" flat round dense />
        </QCardSection>

        <QSeparator />

        <QCardSection class="col scroll q-pa-md">
          <QForm @submit.prevent="saveProblem" class="column q-gutter-md">
            <!-- Title -->
            <QInput
              v-model="problemForm.title"
              label="Problem Title *"
              :rules="[val => !!val || 'Title is required']"
              :class="dark ? 'bg-grey-9' : 'bg-grey-1'"
              outlined
              dense
            />

            <!-- Language Selection -->
            <QSelect
              v-model="problemForm.language"
              :options="languageOptions"
              label="Programming Language"
              :class="dark ? 'bg-grey-9' : 'bg-grey-1'"
              emit-value
              map-options
              outlined
              dense
            />

            <!-- Description (Markdown) -->
            <QInput
              v-model="problemForm.description"
              label="Problem Description (Markdown) *"
              type="textarea"
              :rules="[val => !!val || 'Description is required']"
              :class="dark ? 'bg-grey-9' : 'bg-grey-1'"
              hint="Use markdown for formatting"
              rows="6"
              outlined
            />

            <!-- Starter Code -->
            <QInput
              v-model="problemForm.starterCode"
              label="Starter Code (Optional)"
              type="textarea"
              :class="dark ? 'bg-grey-9' : 'bg-grey-1'"
              hint="Code that candidates will see initially"
              rows="4"
              style="font-family: monospace"
              outlined
            />

            <!-- Action buttons -->
            <div class="row q-gutter-sm justify-end q-mt-sm">
              <QBtn
                label="Cancel"
                @click="closeEditor"
                flat
              />
              <QBtn
                type="submit"
                :label="selectedProblem ? 'Update' : 'Create'"
                :icon="tabDeviceFloppy"
                color="primary"
                :loading="saving"
                unelevated
              />
            </div>
          </QForm>
        </QCardSection>
      </QCard>
    </QDialog>

    <!-- Problem View Dialog -->
    <QDialog v-model="showViewer">
      <QCard style="width: 700px; max-width: 90vw; max-height: 90vh;" class="column" :class="dark ? 'bg-grey-10' : 'bg-white'">
        <QCardSection class="row items-center col-shrink">
          <div class="text-h6">{{ viewingProblem?.title }}</div>
          <QSpace />
          <QChip
            v-if="viewingProblem?.language"
            :label="viewingProblem.language"
            color="primary"
            text-color="white"
            size="sm"
          />
          <QBtn :icon="tabX" @click="showViewer = false" class="q-ml-sm" flat round dense />
        </QCardSection>

        <QSeparator />

        <QCardSection class="col scroll q-pa-md">
          <div class="text-subtitle2 text-weight-medium q-mb-xs">Description</div>
          <div
            class="q-pa-sm rounded-borders markdown-content"
            :class="dark ? 'bg-grey-9' : 'bg-grey-1'"
            v-html="viewingProblemDescription"
          ></div>

          <div v-if="viewingProblem?.starterCode" class="q-mt-md">
            <div class="text-subtitle2 text-weight-medium q-mb-xs">Starter Code</div>
            <pre
              class="q-pa-sm rounded-borders"
              :class="dark ? 'bg-grey-9' : 'bg-grey-1'"
              style="overflow-x: auto; font-family: monospace; font-size: 0.85em; margin: 0;"
            >{{ viewingProblem.starterCode }}</pre>
          </div>
        </QCardSection>
      </QCard>
    </QDialog>

    <!-- Submission Viewer Dialog -->
    <QDialog v-model="showSubmissionViewer">
      <QCard style="width: 700px; max-width: 90vw; max-height: 90vh;" class="column" :class="dark ? 'bg-grey-10' : 'bg-white'">
        <QCardSection class="row items-center col-shrink">
          <div class="text-h6">
            {{ viewingSubmissionProblem?.title }} - Submission
          </div>
          <QSpace />
          <QBtn :icon="tabX" flat round dense v-close-popup />
        </QCardSection>

        <QSeparator />

        <QCardSection class="col scroll">
          <div class="text-subtitle2 q-mb-sm">
            <QIcon :name="tabUser" class="q-mr-xs" />
            {{ getCandidateEmail(viewingSubmission?.candidateUid || '') }}
          </div>
          
          <div class="text-caption text-grey q-mb-md">
            Submitted {{ viewingSubmission ? formatDate(viewingSubmission.submittedUtc) : '' }}
          </div>

          <div class="row items-center q-mb-md">
            <span class="text-weight-medium q-mr-sm">Rating:</span>
            <QRating
              :model-value="viewingSubmission?.rating || 0"
              @update:model-value="(val) => viewingSubmission && rateSubmission(viewingSubmission, val)"
              :max="5"
              size="md"
              color="yellow-8"
              icon="star_border"
              icon-selected="star"
            />
            <span v-if="viewingSubmission?.rating" class="q-ml-sm text-grey">
              ({{ viewingSubmission.rating }}/5)
            </span>
          </div>

          <div class="text-subtitle2 text-weight-medium q-mb-xs">Submitted Code</div>
          <pre
            class="q-pa-md rounded-borders"
            :class="dark ? 'bg-grey-9' : 'bg-grey-1'"
            style="overflow-x: auto; font-family: 'Consolas', 'Monaco', monospace; font-size: 0.85em; margin: 0; white-space: pre-wrap;"
          >{{ viewingSubmission?.code }}</pre>
        </QCardSection>
      </QCard>
    </QDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { CodingProblem, ProblemSubmission } from '../../../shared/domainModels'
import {
  tabCode,
  tabPlus,
  tabPencil,
  tabTrash,
  tabX,
  tabDeviceFloppy,
  tabEye,
  tabUser,
  tabUsers,
} from 'quasar-extras-svg-icons/tabler-icons-v2'
import MarkdownIt from 'markdown-it'
import sanitizeHtml from 'sanitize-html'

const $q = useQuasar()
const dark = computed(() => $q.dark.isActive)

const dayjs = useDayjs()

const { profile } = storeToRefs(useAppStore())
const workspaceStore = useWorkspaceStore()
const { workspace, candidates } = storeToRefs(workspaceStore)

const showEditor = ref(false)
const showViewer = ref(false)
const selectedProblem = ref<CodingProblem | undefined>(undefined)
const viewingProblem = ref<CodingProblem | undefined>(undefined)
const saving = ref(false)

const md = new MarkdownIt({ linkify: true })

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
  { label: 'SQL', value: 'sql' },
  { label: 'Other', value: 'other' },
]

const problemForm = reactive({
  title: '',
  description: '',
  language: 'javascript',
  starterCode: '',
})

// Use workspace.value.problems directly - Vue 3's reactivity should track this
const problems = computed<CodingProblem[]>(() => {
  const probs = workspace.value?.problems
  if (!probs) return []
  return Object.values(probs).sort((a, b) => a.createdUtc.localeCompare(b.createdUtc))
})

const renderedDescription = computed(() => {
  if (!problemForm.description) return '<span class="text-grey">Preview will appear here...</span>'
  return sanitizeHtml(md.render(problemForm.description), {
    allowedTags: ['a', 'p', 'em', 'strong', 'h1', 'h2', 'h3', 'h4', 'hr', 'pre',
      'table', 'tr', 'td', 'th', 'tbody', 'thead', 'strike',
      'blockquote', 'img', 'i', 'b', 'sub', 'super', 'ul', 'ol', 'li',
      'div', 'code', 'span', 'br'],
    allowedAttributes: {
      'code': ['class'],
      'pre': ['class'],
      'span': ['class'],
      'a': ['href', 'target'],
      'img': ['src']
    }
  })
})

const viewingProblemDescription = computed(() => {
  if (!viewingProblem.value) return ''
  return sanitizeHtml(md.render(viewingProblem.value.description), {
    allowedTags: ['a', 'p', 'em', 'strong', 'h1', 'h2', 'h3', 'h4', 'hr', 'pre',
      'table', 'tr', 'td', 'th', 'tbody', 'thead', 'strike',
      'blockquote', 'img', 'i', 'b', 'sub', 'super', 'ul', 'ol', 'li',
      'div', 'code', 'span', 'br'],
    allowedAttributes: {
      'code': ['class'],
      'pre': ['class'],
      'span': ['class'],
      'a': ['href', 'target'],
      'img': ['src']
    }
  })
})

// State for viewing submissions
const showSubmissionViewer = ref(false)
const viewingSubmission = ref<ProblemSubmission | undefined>(undefined)
const viewingSubmissionProblem = ref<CodingProblem | undefined>(undefined)

/**
 * Get all submissions for a specific problem across all candidates
 */
function getSubmissionsForProblem(problemUid: string): (ProblemSubmission & { candidateEmail?: string })[] {
  const submissions: (ProblemSubmission & { candidateEmail?: string })[] = []
  
  for (const candidate of candidates.value) {
    if (candidate.problemSubmissions) {
      const submission = candidate.problemSubmissions[problemUid]
      if (submission) {
        submissions.push({
          ...submission,
          candidateEmail: candidate.email,
        })
      }
    }
  }
  
  return submissions.sort((a, b) => b.submittedUtc.localeCompare(a.submittedUtc))
}

/**
 * Get candidate email by uid
 */
function getCandidateEmail(candidateUid: string): string {
  const candidate = candidates.value.find(c => c.uid === candidateUid)
  return candidate?.email || candidateUid
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  return dayjs(dateStr).format('MMM D, YYYY h:mm A')
}

/**
 * Rate a submission
 */
async function rateSubmission(submission: ProblemSubmission, rating: number) {
  const candidate = candidates.value.find(c => c.uid === submission.candidateUid)
  if (!candidate) return

  try {
    // Update the submission with the new rating
    await candidateReviewRepository.updateFields(candidate.uid, {
      [`problemSubmissions.${submission.problemUid}.rating`]: rating,
      [`problemSubmissions.${submission.problemUid}.status`]: 'reviewed',
    } as any)

    // Update local state for immediate feedback
    if (candidate.problemSubmissions && candidate.problemSubmissions[submission.problemUid]) {
      candidate.problemSubmissions[submission.problemUid].rating = rating
      candidate.problemSubmissions[submission.problemUid].status = 'reviewed'
    }

    $q.notify({
      type: 'positive',
      message: `Rated ${rating}/5`,
      timeout: 1500,
      position: 'bottom-right',
    })
  } catch (e) {
    console.error('Failed to rate submission:', e)
    $q.notify({
      type: 'negative',
      message: 'Failed to save rating',
      timeout: 2000,
      position: 'bottom-right',
    })
  }
}

/**
 * View a submission's code
 */
function viewSubmission(submission: ProblemSubmission, problem: CodingProblem) {
  viewingSubmission.value = submission
  viewingSubmissionProblem.value = problem
  showSubmissionViewer.value = true
}

function viewProblem(problem: CodingProblem) {
  viewingProblem.value = problem
  showViewer.value = true
}

function editProblem(problem: CodingProblem) {
  selectedProblem.value = problem
  problemForm.title = problem.title
  problemForm.description = problem.description
  problemForm.language = problem.language || 'javascript'
  problemForm.starterCode = problem.starterCode || ''
  showEditor.value = true
}

function closeEditor() {
  showEditor.value = false
  selectedProblem.value = undefined
  problemForm.title = ''
  problemForm.description = ''
  problemForm.language = 'javascript'
  problemForm.starterCode = ''
}

async function saveProblem() {
  if (!workspace.value || !profile.value) return

  saving.value = true

  try {
    const problemUid = selectedProblem.value?.uid ?? nanoid(8)

    // Build problem object, excluding undefined fields (Firestore doesn't accept undefined)
    const problem: CodingProblem = {
      uid: problemUid,
      title: problemForm.title,
      description: problemForm.description,
      language: problemForm.language,
      createdUtc: selectedProblem.value?.createdUtc ?? dayjs().utc().toISOString(),
      createdBy: selectedProblem.value?.createdBy ?? profile.value.uid,
    }
    
    // Only add starterCode if it has a value
    if (problemForm.starterCode && problemForm.starterCode.trim()) {
      problem.starterCode = problemForm.starterCode
    }

    // Use store function which handles skipNextUpdate to prevent subscription from overwriting
    await workspaceStore.addProblem(problem)

    $q.notify({
      type: 'positive',
      message: selectedProblem.value ? 'Problem updated!' : 'Problem created!',
      timeout: 2000,
      position: 'bottom-right',
    })

    closeEditor()
  } catch (e: any) {
    console.error('Failed to save problem:', e)
    $q.notify({
      type: 'negative',
      message: `Failed to save problem: ${e?.message || 'Unknown error'}`,
      timeout: 5000,
      position: 'bottom-right',
    })
  } finally {
    saving.value = false
  }
}

async function deleteProblem(problem: CodingProblem) {
  $q.dialog({
    title: 'Delete Problem',
    message: `Are you sure you want to delete "${problem.title}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      // Use store function which handles skipNextUpdate to prevent subscription from overwriting
      await workspaceStore.removeProblem(problem.uid)

      $q.notify({
        type: 'positive',
        message: 'Problem deleted',
        timeout: 2000,
        position: 'bottom-right',
      })
    } catch (e) {
      console.error(e)
      $q.notify({
        type: 'negative',
        message: 'Failed to delete problem',
        timeout: 3000,
        position: 'bottom-right',
      })
    }
  })
}
</script>

<style scoped>
.problems-panel {
  min-height: 100%;
  height: 100%;
}

.problems-list {
  overflow-y: auto;
  max-height: calc(100vh - 150px);
}

.markdown-content {
  line-height: 1.6;
}

:deep(.markdown-content) pre {
  background: rgba(0, 0, 0, 0.1);
  padding: 0.75rem;
  border-radius: 6px;
  overflow-x: auto;
}

:deep(.markdown-content) code {
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 0.9em;
}

:deep(.markdown-content) h1,
:deep(.markdown-content) h2,
:deep(.markdown-content) h3 {
  margin-top: 1em;
  margin-bottom: 0.5em;
}

:deep(.markdown-content) ul,
:deep(.markdown-content) ol {
  padding-left: 1.5em;
}
</style>
