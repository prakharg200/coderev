<template>
  <div class="problem-view q-pa-md column full-height" :class="dark ? 'bg-grey-10' : 'bg-white'">
    <!-- Header -->
    <div class="row items-center q-mb-md col-shrink">
      <QBtn
        :icon="tabArrowLeft"
        @click="$emit('back')"
        flat
        round
        dense
      />
      <QSpace />
      <div class="text-h6">{{ problem.title }}</div>
      <QSpace />
      <QChip
        v-if="problem.language"
        :label="problem.language"
        size="sm"
        color="primary"
        text-color="white"
      />
    </div>

    <QSeparator class="q-mb-md col-shrink" />

    <!-- Problem description -->
    <QScrollArea class="col" style="min-height: 0">
      <div class="row q-gutter-md">
        <!-- Description panel -->
        <div class="col-12 col-md-6">
          <div class="text-subtitle1 text-weight-medium q-mb-sm">Problem Description</div>
          <div
            class="markdown-content q-pa-md rounded-borders"
            :class="dark ? 'bg-grey-9' : 'bg-grey-1'"
            v-html="renderedDescription"
          ></div>
        </div>

        <!-- Code submission panel -->
        <div class="col-12 col-md-6">
          <div class="text-subtitle1 text-weight-medium q-mb-sm">
            Your Solution
            <QChip
              v-if="submission?.status"
              :color="submission.status === 'reviewed' ? 'positive' : 'warning'"
              :label="submission.status === 'reviewed' ? 'Reviewed' : 'Pending'"
              size="sm"
              class="q-ml-sm"
            />
          </div>
          
          <QInput
            v-model="code"
            type="textarea"
            :placeholder="problem.starterCode || 'Write your solution here...'"
            :class="dark ? 'bg-grey-9' : 'bg-grey-1'"
            :disable="isInterviewer"
            style="font-family: monospace"
            outlined
            autogrow
          />

          <!-- Feedback (if reviewed) -->
          <div v-if="submission?.feedback" class="q-mt-md">
            <div class="text-subtitle2 text-weight-medium q-mb-sm">Feedback</div>
            <QBanner
              :class="dark ? 'bg-grey-9' : 'bg-grey-1'"
              rounded
            >
              {{ submission.feedback }}
            </QBanner>
          </div>

          <!-- Submit button (for candidates) -->
          <QBtn
            v-if="!isInterviewer"
            class="q-mt-md full-width"
            label="Submit Solution"
            :icon="tabSend"
            color="primary"
            :loading="submitting"
            :disable="!code.trim()"
            @click="submitSolution"
            unelevated
          />

          <!-- Review buttons (for interviewers) -->
          <div v-if="isInterviewer && submission" class="q-mt-md">
            <div class="text-subtitle2 text-weight-medium q-mb-sm">Review Submission</div>
            <QInput
              v-model="feedback"
              type="textarea"
              placeholder="Add feedback for the candidate..."
              :class="dark ? 'bg-grey-9' : 'bg-grey-1'"
              outlined
              autogrow
            />
            <QBtn
              class="q-mt-sm full-width"
              label="Submit Review"
              :icon="tabCheck"
              color="positive"
              :loading="reviewing"
              @click="submitReview"
              unelevated
            />
          </div>
        </div>
      </div>
    </QScrollArea>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import type { CodingProblem, ProblemSubmission } from '../../../shared/domainModels'
import {
  tabArrowLeft,
  tabSend,
  tabCheck,
} from 'quasar-extras-svg-icons/tabler-icons-v2'
import MarkdownIt from 'markdown-it'
import sanitizeHtml from 'sanitize-html'

const props = defineProps<{
  problem: CodingProblem
  isInterviewer?: boolean
}>()

const emit = defineEmits<{
  back: []
}>()

const $q = useQuasar()
const dark = computed(() => $q.dark.isActive)
const dayjs = useDayjs()

const { profile } = storeToRefs(useAppStore())
const workspaceStore = useWorkspaceStore()
const { candidate } = storeToRefs(workspaceStore)

const code = ref(props.problem.starterCode || '')
const feedback = ref('')
const submitting = ref(false)
const reviewing = ref(false)

const md = new MarkdownIt({ linkify: true })

// Get existing submission
const submission = computed<ProblemSubmission | undefined>(() => {
  return candidate.value?.problemSubmissions?.[props.problem.uid]
})

// Load existing submission code
watch(submission, (sub) => {
  if (sub?.code) {
    code.value = sub.code
  }
  if (sub?.feedback) {
    feedback.value = sub.feedback
  }
}, { immediate: true })

// Render markdown description
const renderedDescription = computed(() => {
  return sanitizeHtml(md.render(props.problem.description), {
    allowedTags: ['a', 'p', 'em', 'strong', 'h1', 'h2', 'h3', 'h4', 'hr', 'pre',
      'table', 'tr', 'td', 'th', 'tbody', 'thead', 'strike',
      'blockquote', 'img', 'i', 'b', 'sub', 'super', 'ul', 'ol', 'li',
      'div', 'code', 'span'],
    allowedAttributes: {
      'code': ['class'],
      'pre': ['class'],
      'span': ['class'],
      'a': ['href', 'target'],
      'img': ['src']
    }
  })
})

/**
 * Submit solution (for candidates)
 */
async function submitSolution() {
  if (!candidate.value || !profile.value) return

  submitting.value = true

  try {
    const submissionData: ProblemSubmission = {
      uid: nanoid(8),
      problemUid: props.problem.uid,
      candidateUid: candidate.value.uid,
      code: code.value,
      submittedUtc: dayjs().utc().toISOString(),
      status: 'pending',
    }

    await candidateReviewRepository.updateFields(candidate.value.uid, {
      [`problemSubmissions.${props.problem.uid}`]: submissionData,
    })

    // Update local state
    if (!candidate.value.problemSubmissions) {
      candidate.value.problemSubmissions = {}
    }
    candidate.value.problemSubmissions[props.problem.uid] = submissionData

    $q.notify({
      type: 'positive',
      message: 'Solution submitted successfully!',
      timeout: 2000,
      position: 'bottom-right',
    })
  } catch (e) {
    console.error(e)
    $q.notify({
      type: 'negative',
      message: 'Failed to submit solution',
      timeout: 3000,
      position: 'bottom-right',
    })
  } finally {
    submitting.value = false
  }
}

/**
 * Submit review (for interviewers)
 */
async function submitReview() {
  if (!candidate.value || !submission.value) return

  reviewing.value = true

  try {
    await candidateReviewRepository.updateFields(candidate.value.uid, {
      [`problemSubmissions.${props.problem.uid}.status`]: 'reviewed',
      [`problemSubmissions.${props.problem.uid}.feedback`]: feedback.value,
    })

    // Update local state
    submission.value.status = 'reviewed'
    submission.value.feedback = feedback.value

    $q.notify({
      type: 'positive',
      message: 'Review submitted!',
      timeout: 2000,
      position: 'bottom-right',
    })
  } catch (e) {
    console.error(e)
    $q.notify({
      type: 'negative',
      message: 'Failed to submit review',
      timeout: 3000,
      position: 'bottom-right',
    })
  } finally {
    reviewing.value = false
  }
}
</script>

<style scoped>
.problem-view {
  height: 100%;
}

.markdown-content {
  font-size: 0.9rem;
  line-height: 1.6;
}

:deep(.markdown-content) pre {
  background: rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  border-radius: 4px;
  overflow-x: auto;
}

:deep(.markdown-content) code {
  font-family: monospace;
}
</style>
