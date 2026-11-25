<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { initWechatPrivacyListener } from '@/utils/wechatPrivacy'

onLaunch(() => {
  initWechatPrivacyListener()
})

onShow(() => {
  // App shown
})

onHide(() => {
  // App hidden
})
</script>

<style>
/* App.vue style */
</style>
