<template>
  <div
    class="ai-chat-message row q-mb-md"
    :class="{ 'justify-end': isUser, 'justify-start': !isUser }"
  >
    <div
      class="message-bubble q-pa-md"
      :class="bubbleClass"
      style="max-width: 85%; border-radius: 12px"
    >
      <!-- User message: plain text -->
      <div v-if="isUser" class="text-body2">
        {{ message.content }}
      </div>

      <!-- Assistant message: markdown rendered -->
      <div
        v-else
        class="markdown-content text-body2"
        v-html="renderedContent"
      ></div>

      <!-- Code context badge if present -->
      <div
        v-if="message.codeContext"
        class="q-mt-sm text-caption"
        :class="dark ? 'text-grey-5' : 'text-grey-7'"
      >
        <QIcon :name="tabCode" size="xs" class="q-mr-xs" />
        {{ message.codeContext.fileName }}
        (L{{ message.codeContext.lineRange[0] }}-{{ message.codeContext.lineRange[1] }})
      </div>

      <!-- Timestamp -->
      <div
        class="text-caption q-mt-xs"
        :class="dark ? 'text-grey-6' : 'text-grey-5'"
      >
        {{ formattedTime }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import highlightjs from 'markdown-it-highlightjs'
import sanitizeHtml from 'sanitize-html'
import { tabCode } from 'quasar-extras-svg-icons/tabler-icons-v2'
import type { ChatMessage } from '../../stores/chatStore'

const props = defineProps<{
  message: ChatMessage
}>()

const $q = useQuasar()
const dayjs = useDayjs()

const dark = computed(() => $q.dark.isActive)

const isUser = computed(() => props.message.role === 'user')

const bubbleClass = computed(() => {
  if (isUser.value) {
    return dark.value ? 'bg-purple-8 text-white' : 'bg-purple-2 text-black'
  }
  return dark.value ? 'bg-grey-9 text-white' : 'bg-grey-2 text-black'
})

const formattedTime = computed(() => {
  return dayjs(props.message.timestamp).format('h:mm A')
})

// Markdown renderer
const md = MarkdownIt({
  linkify: true,
  typographer: true,
  html: true
}).use(highlightjs)

const renderedContent = computed(() => {
  return sanitizeHtml(md.render(props.message.content), {
    allowedTags: [
      'a', 'p', 'em', 'strong', 'h1', 'h2', 'h3', 'h4', 'hr', 'pre',
      'table', 'tr', 'td', 'th', 'tbody', 'thead', 'strike',
      'blockquote', 'img', 'i', 'b', 'sub', 'super', 'ul', 'ol', 'li',
      'div', 'code', 'span', 'br'
    ],
    allowedAttributes: {
      'code': ['class'],
      'pre': ['class'],
      'span': ['class'],
      'a': ['href', 'target'],
    }
  })
})
</script>

<style scoped>
.message-bubble {
  word-wrap: break-word;
  overflow-wrap: break-word;
}

:deep(.markdown-content code) {
  font-family: Menlo, Monaco, Lucida Console, monospace;
  font-size: 0.85em;
  padding: 0.2em 0.4em;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.1);
}

:deep(.markdown-content pre) {
  border-radius: 8px;
  overflow-x: auto;
}

:deep(.markdown-content pre code) {
  padding: 0;
  background: none;
}

:deep(.markdown-content p) {
  margin: 0.5em 0;
}

:deep(.markdown-content p:first-child) {
  margin-top: 0;
}

:deep(.markdown-content p:last-child) {
  margin-bottom: 0;
}
</style>
