<template>
  <QCard
    class="ai-chat-panel-embedded column"
    :class="dark ? 'bg-grey-10 text-white' : 'bg-white text-black'"
    flat
  >
    <!-- Header (simplified - no close button) -->
    <QCardSection
      class="row items-center q-py-sm col-shrink"
      :class="dark ? 'bg-grey-9' : 'bg-grey-1'"
    >
      <QIcon :name="tabMessageChatbot" size="sm" class="q-mr-sm" />
      <span class="text-subtitle1 text-weight-medium">AI Assistant</span>
      <QSpace />
      <QBtn
        :icon="tabTrash"
        size="sm"
        :disable="messages.length === 0"
        @click="chatStore.clearChat()"
        flat
        round
        dense
      >
        <QTooltip>Clear chat</QTooltip>
      </QBtn>
    </QCardSection>

    <QSeparator />

    <!-- Messages area -->
    <QCardSection
      ref="messagesContainer"
      class="col q-pa-md scroll"
      style="overflow-y: auto"
    >
      <!-- Empty state -->
      <div
        v-if="messages.length === 0"
        class="column items-center justify-center full-height text-center"
        :class="dark ? 'text-grey-5' : 'text-grey-6'"
      >
        <QIcon :name="tabMessageChatbot" size="64px" class="q-mb-md" />
        <div class="text-h6">Ask about the code</div>
        <div class="text-body2 q-mt-sm" style="max-width: 280px">
          Ask questions about the code you're reviewing. Toggle context to include selected code.
        </div>
      </div>

      <!-- Message list -->
      <WorkspaceAiChatMessage
        v-for="message in messages"
        :key="message.uid"
        :message="message"
      />

      <!-- Loading indicator -->
      <div v-if="isLoading" class="row justify-start q-mb-md">
        <div
          class="q-pa-md"
          :class="dark ? 'bg-grey-9' : 'bg-grey-2'"
          style="border-radius: 12px"
        >
          <QSpinner size="sm" />
          <span class="q-ml-sm text-body2">Thinking...</span>
        </div>
      </div>

      <!-- Error message -->
      <div v-if="error" class="q-mb-md">
        <QBanner
          class="bg-negative text-white"
          rounded
        >
          {{ error }}
        </QBanner>
      </div>
    </QCardSection>

    <QSeparator />

    <!-- Context toggle -->
    <QCardSection class="q-py-sm col-shrink">
      <QToggle
        v-model="includeContext"
        :label="contextLabel"
        size="sm"
        :disable="!hasSelection"
      />
    </QCardSection>

    <QSeparator />

    <!-- Input area -->
    <QCardSection class="q-pa-sm col-shrink">
      <div class="row items-end q-gutter-sm">
        <QInput
          v-model="inputMessage"
          placeholder="Ask about the code..."
          :class="dark ? 'bg-grey-9' : 'bg-grey-1'"
          type="textarea"
          autogrow
          :max-height="120"
          class="col"
          :disable="isLoading"
          @keydown.enter.prevent="handleEnter"
          outlined
          dense
        />
        <QBtn
          :icon="tabSend"
          color="primary"
          :disable="!inputMessage.trim() || isLoading"
          @click="sendMessage"
          round
        />
      </div>
    </QCardSection>
  </QCard>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '../../stores/chatStore'
import type { SourceFile, SourceSelection } from '../../../shared/viewModels'
import {
  tabMessageChatbot,
  tabSend,
  tabTrash,
} from 'quasar-extras-svg-icons/tabler-icons-v2'

const props = defineProps<{
  selectedSourceFile?: SourceFile
  selection?: SourceSelection
}>()

const $q = useQuasar()
const dark = computed(() => $q.dark.isActive)

const chatStore = useChatStore()
const { messages, isLoading, error } = storeToRefs(chatStore)

const inputMessage = ref('')
const includeContext = ref(true)
const messagesContainer = ref<HTMLElement | null>(null)

// Check if there's a valid code selection
const hasSelection = computed(() => {
  return props.selection && 
         props.selection.fromLine !== props.selection.toLine
})

// Context label shows what will be included
const contextLabel = computed(() => {
  if (!props.selectedSourceFile) {
    return 'No file selected'
  }
  if (!hasSelection.value) {
    return `Include: ${props.selectedSourceFile.name} (no selection)`
  }
  return `Include: ${props.selectedSourceFile.name} L${props.selection!.fromLine}-${props.selection!.toLine}`
})

// Scroll to bottom when new messages arrive
watch(messages, async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}, { deep: true })

/**
 * Handle Enter key - send on Enter, newline on Shift+Enter
 */
function handleEnter(e: KeyboardEvent) {
  if (e.shiftKey) {
    inputMessage.value += '\n'
  } else {
    sendMessage()
  }
}

/**
 * Send the message to the AI
 */
async function sendMessage() {
  const content = inputMessage.value.trim()
  if (!content || isLoading.value) return

  inputMessage.value = ''

  // Build context if enabled and available
  let context: { fileName: string; code: string; lineRange: [number, number] } | undefined

  if (includeContext.value && props.selectedSourceFile && props.selection) {
    // Extract selected code from the source file
    const lines = props.selectedSourceFile.text.split('\n')
    const selectedLines = lines.slice(
      props.selection.fromLine - 1,
      props.selection.toLine
    )
    
    context = {
      fileName: props.selectedSourceFile.name,
      code: selectedLines.join('\n'),
      lineRange: [props.selection.fromLine, props.selection.toLine]
    }
  }

  await chatStore.sendMessage(content, context)
}
</script>

<style scoped>
.ai-chat-panel-embedded {
  height: 100%;
  width: 100%;
}
</style>
