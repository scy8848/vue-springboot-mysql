<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <main class="auth-shell">
    <section class="auth-story" aria-label="品牌介绍">
      <RouterLink class="brand" to="/products">
        <span class="brand-mark">M</span><span>MORI 森集</span>
      </RouterLink>
      <div class="story-copy">
        <h1>{{ title }}</h1>
        <p>把真正耐用、舒适、有温度的日常好物，带回你的生活。成为会员，收藏每一次认真挑选。</p>
      </div>
    </section>
    <section class="auth-main"><slot /></section>
  </main>
</template>
