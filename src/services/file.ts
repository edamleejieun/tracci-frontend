import { http } from '@/utils/http'
import type {
  UploadCredentialRequest,
  UploadCredentialResponse,
  ConfirmUploadRequest,
  FileItem,
  AccessUrlResponse
} from '@/types/file'

export const FileService = {
  /**
   * 创建上传凭证
   */
  getUploadCredentials(data: UploadCredentialRequest) {
    return http<UploadCredentialResponse>({
      url: `/files/upload-credentials`,
      method: 'POST',
      data
    })
  },

  /**
   * 确认上传完成
   */
  confirmUpload(fileId: string, data: ConfirmUploadRequest) {
    return http<FileItem>({
      url: `/files/${fileId}/confirm`,
      method: 'POST',
      data
    })
  },

  /**
   * 获取文件访问地址
   */
  getAccessUrl(fileId: string) {
    return http<AccessUrlResponse>({
      url: `/files/${fileId}/access-url`,
      method: 'GET'
    })
  },

  /**
   * 删除文件
   */
  deleteFile(fileId: string) {
    return http<void>({
      url: `/files/${fileId}`,
      method: 'DELETE'
    })
  }
}
