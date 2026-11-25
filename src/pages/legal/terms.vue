<template>
  <LegalDocumentPage
    title="用户协议"
    :sections="TERMS_SECTIONS"
    :contact-email="LEGAL_CONTACT_EMAIL"
  />
</template>

<script setup lang="ts">
import LegalDocumentPage from '@/components/legal/LegalDocumentPage.vue'
import { TERMS_SECTIONS, LEGAL_CONTACT_EMAIL } from '@/constants/legalContent'
</script>
