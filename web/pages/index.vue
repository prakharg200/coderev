<template>
  <div class="row text-center">
    <!-- Hero Section -->
    <section
      class="q-pb-xl offset-xl-3 offset-md-2 offset-sm-1 col-xl-6 col-md-8 col-sm-10 col-xs-12"
    >
      <div class="header">
        <h1 class="q-my-none q-py-xl gradient-text">CodeCrucible</h1>
        <p class="tagline">The Modern Interview Platform</p>
        <p class="subtitle">
          AI-powered tools for technical interviews.<br />
          Code reviews • Custom problems • Real-time collaboration
        </p>
        <div class="q-mt-xl">
          <QBtn
            v-bind="btnProps"
            to="/login"
            label="Get Started Free"
            class="q-mt-sm"
            :class="{ 'full-width': $q.screen.lt.sm }"
            size="xl"
            color="accent"
          />
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <div
      class="offset-xl-2 offset-md-1 col-xl-8 col-md-10 col-sm-12"
    >
      <section class="q-px-md">
        <h2
          class="q-my-none q-pt-xl q-pb-lg"
          :class="[dark ? 'text-deep-purple-3' : 'text-accent']"
        >
          Everything You Need for Technical Interviews
        </h2>

        <div class="row q-col-gutter-lg">
          <div v-for="feature in features" :key="feature.title" class="col-md-4 col-sm-6 col-12">
            <QCard class="feature-card fit column" :class="dark ? 'bg-grey-10' : 'bg-white'" flat bordered>
              <QCardSection class="text-center q-pb-none">
                <QIcon :name="feature.icon" size="48px" :color="dark ? 'deep-purple-3' : 'accent'" />
              </QCardSection>
              <QCardSection class="text-h5 text-center q-pb-xs">{{ feature.title }}</QCardSection>
              <QCardSection class="text-body1 text-grey-7 text-center q-pt-none">
                {{ feature.description }}
              </QCardSection>
            </QCard>
          </div>
        </div>
      </section>

      <!-- How It Works -->
      <section class="q-px-md q-mt-xl">
        <h2
          class="q-my-none q-pt-xl q-pb-lg"
          :class="[dark ? 'text-deep-purple-3' : 'text-accent']"
        >
          How It Works
        </h2>

        <div class="row q-col-gutter-md">
          <div v-for="(step, index) in steps" :key="step.title" class="col-md-3 col-sm-6 col-12">
            <QCard class="fit column" :class="dark ? 'bg-grey-10' : 'bg-grey-1'" flat>
              <QCardSection class="text-center">
                <div class="step-number" :class="dark ? 'bg-deep-purple-8' : 'bg-accent'">
                  {{ index + 1 }}
                </div>
              </QCardSection>
              <QCardSection class="text-h6 text-center q-pb-xs">{{ step.title }}</QCardSection>
              <QCardSection class="text-body2 text-grey-6 text-center q-pt-none">
                {{ step.description }}
              </QCardSection>
            </QCard>
          </div>
        </div>
      </section>

      <!-- Why CodeCrucible -->
      <section class="q-px-md q-mt-xl q-pb-xl">
        <h2
          class="q-my-none q-pt-xl q-pb-lg"
          :class="[dark ? 'text-deep-purple-3' : 'text-accent']"
        >
          Why CodeCrucible?
        </h2>

        <div class="row q-col-gutter-md">
          <div v-for="reason in reasons" :key="reason" class="col-md-4 col-sm-6 col-12">
            <QCard class="fit" :class="dark ? 'bg-grey-10' : 'bg-white'" flat bordered>
              <QCardSection class="row items-start">
                <QIcon :name="tabCheck" color="positive" size="24px" class="q-mr-sm" />
                <div class="col text-body1">{{ reason }}</div>
              </QCardSection>
            </QCard>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="q-px-md q-py-xl" :class="dark ? 'bg-grey-10' : 'bg-accent'">
        <h2 class="q-my-none q-pb-md text-white">
          Ready to Transform Your Interviews?
        </h2>
        <p class="text-white text-h6 q-mb-lg" style="opacity: 0.9;">
          Join teams using CodeCrucible for smarter, AI-powered technical interviews.
        </p>
        <QBtn
          v-bind="btnProps"
          to="/login"
          label="Start Free Today"
          size="xl"
          color="white"
          text-color="accent"
        />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  tabCode,
  tabCheck,
  tabUsers,
  tabMessage,
  tabBrain,
  tabFileCode,
  tabStar,
  tabClipboardCheck,
} from "quasar-extras-svg-icons/tabler-icons-v2";
import { btnProps } from "../utils/commonProps";

const description =
  "CodeCrucible is the modern AI-powered interview platform. Conduct technical interviews with code reviews, custom problems, and real-time collaboration.";

const title = "CodeCrucible - The Modern Interview Platform";

useHead({
  link: [
    {
      rel: "canonical",
      href: "https://codecrucible.app",
    },
  ],
});

useHeadSafe({
  title: title,
  meta: [{ name: "description", content: description }],
});

useSeoMeta({
  title: title,
  description: description,
  ogTitle: title,
  ogDescription: description,
  ogUrl: import.meta.env.VITE_PUBLISHED_BASE_URL,
  twitterTitle: title,
  twitterDescription: description,
  twitterCard: "summary_large_image",
});

const $q = useQuasar();
const dark = computed(() => $q.dark.isActive);

const features = [
  {
    icon: tabCode,
    title: "Code Reviews",
    description: "Review real code snippets instead of abstract algorithms. Evaluate how candidates reason about actual code.",
  },
  {
    icon: tabFileCode,
    title: "Custom Problems",
    description: "Create coding challenges with markdown descriptions, starter code, and automated solution tracking.",
  },
  {
    icon: tabBrain,
    title: "AI Assistant",
    description: "Built-in AI chat powered by Google Gemini to help interviewers and enhance the experience.",
  },
  {
    icon: tabStar,
    title: "Rating System",
    description: "Rate candidates on multiple dimensions - overall, depth, thoroughness, and clarity.",
  },
  {
    icon: tabUsers,
    title: "Team Collaboration",
    description: "Multiple interviewers can collaborate, leave notes, and compare candidate responses.",
  },
  {
    icon: tabMessage,
    title: "Comments & Feedback",
    description: "Line-by-line comments with threaded discussions. Candidates and interviewers can communicate clearly.",
  },
];

const steps = [
  {
    title: "Create Workspace",
    description: "Set up a workspace for each role you're hiring for.",
  },
  {
    title: "Add Content",
    description: "Upload source files and create coding problems.",
  },
  {
    title: "Invite Candidates",
    description: "Each candidate gets their own isolated review environment.",
  },
  {
    title: "Evaluate & Rate",
    description: "Review submissions, compare candidates, and make decisions.",
  },
];

const reasons = [
  "Reflects real day-to-day engineering responsibilities",
  "Open-ended and collaborative evaluation",
  "Hard to game with AI or leetcode prep",
  "Evaluate reading comprehension, not just coding",
  "Less stressful for candidates",
  "Faster to set up than custom solutions",
  "Works for managers, architects, and support roles",
  "Evaluate AI-generated code review skills",
  "Free and easy to get started",
];
</script>

<style scoped>
.header h1 {
  font-size: 4.8em;
  font-weight: 700;
  line-height: 1em;
}

.gradient-text {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tagline {
  font-size: 2.5em;
  font-weight: 500;
  margin: 0;
  opacity: 0.9;
}

.subtitle {
  font-size: 1.4em;
  color: #6b7280;
  margin-top: 16px;
}

h2 {
  font-size: 2.5em;
}

.feature-card {
  min-height: 200px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.step-number {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5em;
  font-weight: 700;
}

p {
  text-align: center;
}
</style>
