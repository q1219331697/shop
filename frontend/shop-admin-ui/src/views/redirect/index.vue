<template>
  <div />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

onMounted(() => {
  const { params, query } = route
  const path = params.path as string
  router.replace({ path: '/' + path, query })
})
</script>
