---
layout: false
---

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vitepress'

const router = useRouter()

onMounted(() => {
  router.go('/zh/')
})
</script>

<div style="display:flex; justify-content:center; align-items:center; height:100vh; color:#64748b;">
  Redirecting to <a href="/zh/" style="margin-left:5px; color:#3b82f6;">Chinese Docs...</a>
</div>
