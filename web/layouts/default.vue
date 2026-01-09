<template>
  <QLayout
    view="hHh lpR fFf"
    :class="{
      'bg-dark text-white': dark,
      'bg-white text-black': !dark,
    }"
  >
    <QHeader
      class="header row"
      :height-hint="98"
      :class="{
        'bg-dark text-white': dark,
        'bg-white text-black': !dark,
      }"
    >
      <QToolbar class="q-py-sm offset-md-2 col-md-8 col-sm-12 toolbar">
        <QToolbarTitle
          class="text-h5 text-weight-medium cursor-pointer"
          @click="navigateTo('/')"
        >
          CodeCrucible
        </QToolbarTitle>

        <QBtn
          title="Toggle dark mode"
          :icon="dark ? tabMoon : tabSun"
          @click="$q.dark.toggle()"
          dense
          flat
        />
      </QToolbar>

      <QTabs v-model="tab" class="col-12" inline-label>
        <QRouteTab label="Home" name="home" class="rounded-borders" no-caps to="/" />
        <QRouteTab
          label="Login"
          name="login"
          class="rounded-borders"
          to="/login"
          :icon="tabLogin2"
          no-caps
          exact
        />
      </QTabs>
    </QHeader>

    <QPageContainer :class="[dark ? 'bg-dark' : 'bg-white']">
      <QPage class="" padding>
        <NuxtPage />
      </QPage>
    </QPageContainer>

    <QFooter
      class="text-center q-py-md"
      :height-hint="53"
      :class="[dark ? 'bg-grey-10' : 'bg-grey-1']"
      reveal
      bordered
    >
      <div class="text-caption text-grey">
        © {{ new Date().getFullYear() }} CodeCrucible. All rights reserved.
      </div>
    </QFooter>
  </QLayout>
</template>

<script setup lang="ts">
import { navigateTo } from "nuxt/app";
import {
  tabLogin2,
  tabMoon,
  tabSun,
} from "quasar-extras-svg-icons/tabler-icons-v2";

const $q = useQuasar();

const $route = useRoute();

const tab = ref<"home" | "login">("home");

const dark = computed(() => $q.dark.isActive);

useHead({
  htmlAttrs: {
    class: "dark",
  },
  link: [
    {
      rel: "preconnect",
      href: "https://firebase.googleapis.com",
    },
    {
      rel: "preconnect",
      href: "https://storage.googleapis.com",
    },
    {
      rel: "preconnect",
      href: "https://storage.cloud.google.com",
    },
  ],
});
</script>

<style scoped>
.header {
  opacity: 0.95;
}
</style>
