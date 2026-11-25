import { http } from '@/utils/http'
import type { SubmitFeedbackRequest, SubmitFeedbackResponse } from '@/types/feedback'

export const FeedbackService = {
  submitFeedback(data: SubmitFeedbackRequest) {
    return http<SubmitFeedbackResponse>({
      url: '/feedbacks',
      method: 'POST',
      data
    })
  }
}
