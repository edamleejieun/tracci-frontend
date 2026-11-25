<template>
  <LegalDocumentPage
    title="隐私政策"
    :sections="PRIVACY_SECTIONS"
    :contact-email="LEGAL_CONTACT_EMAIL"
    :show-wechat-contract-entry="true"
  />
</template>

<script setup lang="ts">
import LegalDocumentPage from '@/components/legal/LegalDocumentPage.vue'
import { PRIVACY_SECTIONS, LEGAL_CONTACT_EMAIL } from '@/constants/legalContent'
</script>
