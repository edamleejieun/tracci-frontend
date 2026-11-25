import { ref } from 'vue'
import { FileService } from '@/services/file'
import type { LocalUploadFile, FileBusinessType } from '@/types/file'
import { ensureWechatPrivacyAuthorized } from '@/utils/wechatPrivacy'

/** COS POST 表单上传地址必须是 Bucket 根路径（带尾斜杠），保留 query string 中的临时凭证 */
function normalizeCosPostUploadUrl(uploadUrl: string): string {
  try {
    const urlObj = new URL(uploadUrl)
    return `${urlObj.origin}/${urlObj.search}`
  } catch {
    return uploadUrl.endsWith('/') ? uploadUrl : `${uploadUrl}/`
  }
}

/** 微信小程序 uploadFile 的 formData 值需为字符串 */
function stringifyCosFormData(formData?: Record<string, string>): Record<string, string> | undefined {
  if (!formData) return undefined
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(formData)) {
    result[key] = value == null ? '' : String(value)
  }
  return result
}

function getLocalFileSize(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    uni.getFileInfo({
      filePath,
      success: res => resolve(res.size),
      fail: err => reject(err)
    })
  })
}

function compressMiniProgramImage(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.compressImage({
      src: filePath,
      quality: 80,
      success: res => resolve(res.tempFilePath),
      fail: err => reject(err)
    })
  })
}

function withJpegExtension(fileName?: string): string {
  const fallback = `image_${Date.now()}.jpg`
  if (!fileName) return fallback
  return fileName.replace(/\.[^.\\/]+$/, '') + '.jpg'
}

export function useImageUpload() {
  const uploadFiles = ref<LocalUploadFile[]>([])

  const chooseImages = async (
    maxCount = 9,
    businessType: FileBusinessType = 'JOURNAL_PHOTO',
    businessId?: string
  ) => {
    const currentCount = uploadFiles.value.length
    const remainCount = maxCount - currentCount

    if (remainCount <= 0) {
      uni.showToast({ title: `最多只能选择 ${maxCount} 张图片`, icon: 'none' })
      return
    }

    try {
      const privacyGranted = await ensureWechatPrivacyAuthorized()
      if (!privacyGranted) {
        uni.showToast({ title: '需同意隐私指引后才能选择图片', icon: 'none' })
        return
      }

      const res = await uni.chooseImage({
        count: remainCount,
        sizeType: ['original', 'compressed'],
        sourceType: ['album']
      })

      const tempFiles = (res.tempFiles as { path: string; size?: number; name?: string; type?: string }[] | undefined)
        ?? (res.tempFilePaths || []).map(path => ({ path, size: 0 }))

      for (const file of tempFiles) {
        let localPath = file.path
        let wasCompressedForMiniProgram = false
        let fileSize = file.size ?? 0
        if (!fileSize) {
          try {
            fileSize = await getLocalFileSize(localPath)
          } catch (err) {
            console.error('Get file size failed:', err)
          }
        }

        if (!fileSize) {
          uni.showToast({ title: '图片文件为空或无法读取大小，请重试', icon: 'none' })
          continue
        }

        // #ifndef H5
        try {
          const compressedPath = await compressMiniProgramImage(localPath)
          if (compressedPath) {
            localPath = compressedPath
            fileSize = await getLocalFileSize(localPath)
            wasCompressedForMiniProgram = true
          }
        } catch (err) {
          console.warn('Compress image failed, fallback to original:', err)
        }
        // #endif

        if (fileSize > 5 * 1024 * 1024) {
          uni.showToast({ title: '单张图片大小不能超过 5MB', icon: 'none' })
          continue
        }

        // Determine content type
        let contentType = wasCompressedForMiniProgram ? 'image/jpeg' : (file.type || 'image/jpeg')
        if (!wasCompressedForMiniProgram && (!file.type || file.type === 'image/jpeg')) {
          const nameToMatch = (file.name || localPath || '').toLowerCase()
          if (nameToMatch.endsWith('.png')) {
            contentType = 'image/png'
          } else if (nameToMatch.endsWith('.webp')) {
            contentType = 'image/webp'
          } else if (nameToMatch.endsWith('.avif')) {
            contentType = 'image/avif'
          } else if (nameToMatch.endsWith('.gif')) {
            contentType = 'image/gif'
          }
        }

        // Get image dimensions
        let width = 0
        let height = 0
        try {
          const imageInfo = await uni.getImageInfo({ src: localPath })
          width = imageInfo.width
          height = imageInfo.height
        } catch (err) {
          console.error('Get image info failed:', err)
        }

        const newFile: LocalUploadFile = {
          id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          localPath,
          fileName: wasCompressedForMiniProgram ? withJpegExtension(file.name) : (file.name || `image_${Date.now()}.jpg`),
          contentType,
          size: fileSize,
          width,
          height,
          status: 'waiting',
          progress: 0,
          businessType,
          businessId
        }

        uploadFiles.value.push(newFile)
      }

      // Start uploading waiting files
      processUploadQueue()
    } catch (e: unknown) {
      console.error('Choose image failed:', e)
      const errMsg = (e as { errMsg?: string })?.errMsg || ''
      if (/cancel$/i.test(errMsg) || errMsg.includes(':fail cancel')) return
      if (/privacy|隐私|authorize|authorization/i.test(errMsg)) {
        uni.showToast({ title: '需同意隐私指引后才能选择图片', icon: 'none' })
        return
      }
      uni.showToast({ title: '无法打开相册，请稍后重试', icon: 'none' })
    }
  }

  const processUploadQueue = async () => {
    for (let i = 0; i < uploadFiles.value.length; i++) {
      const file = uploadFiles.value[i]
      if (file.status === 'waiting' || file.status === 'failed') {
        await uploadSingleFile(i)
      }
    }
  }

  const uploadSingleFile = async (index: number) => {
    const file = uploadFiles.value[index]
    if (!file) return

    file.status = 'uploading'
    file.progress = 10
    file.error = undefined

    try {
      // 1. Get upload credentials
      const credRes = await FileService.getUploadCredentials({
        businessType: file.businessType || 'JOURNAL_PHOTO',
        businessId: file.businessId,
        fileName: file.fileName,
        contentType: file.contentType,
        size: file.size,
        uploadMethod: 'POST'
      })

      file.fileId = credRes.fileId
      file.uploadUrl = credRes.uploadUrl
      file.method = credRes.method
      file.headers = credRes.headers
      file.formData = credRes.formData
      file.fileFieldName = credRes.fileFieldName
      file.progress = 30

      // 2. Upload to COS
      await uploadToCOS(file)

      file.progress = 80

      // 3. Confirm upload
      file.progress = 88
      const confirmRes = await FileService.confirmUpload(file.fileId, {
        width: file.width,
        height: file.height
      })

      file.status = 'uploaded'
      file.progress = 100
      file.url = confirmRes.url
      file.thumbnailUrl = confirmRes.thumbnailUrl
      file.previewUrl = confirmRes.previewUrl
      file.exportUrl = confirmRes.exportUrl
      file.watermarkedUrl = confirmRes.watermarkedUrl
    } catch (e: any) {
      console.error('Upload failed:', e)
      file.status = 'failed'
      file.error = e.message || '上传失败'
    }
  }

  const uploadToCOS = (file: LocalUploadFile): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!file.uploadUrl) {
        reject(new Error('No upload URL'))
        return
      }

      // Determine platform
      // #ifdef H5
      uploadToCOSH5(file).then(resolve).catch(reject)
      // #endif

      // #ifndef H5
      uploadToCOSMiniProgram(file).then(resolve).catch(reject)
      // #endif
    })
  }

  const uploadToCOSH5 = async (file: LocalUploadFile): Promise<void> => {
    try {
      // Fetch local file blob
      const response = await fetch(file.localPath)
      const blob = await response.blob()

      const formData = new FormData()
      if (file.formData) {
        Object.entries(file.formData).forEach(([key, value]) => {
          formData.append(key, value)
        })
      }
      formData.append(file.fileFieldName || 'file', blob, file.fileName)

      const uploadUrl = normalizeCosPostUploadUrl(file.uploadUrl!)

      const postResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      })

      if (!postResponse.ok) {
        throw new Error(`COS upload failed with status ${postResponse.status}`)
      }
    } catch (e) {
      throw e
    }
  }

  const uploadToCOSMiniProgram = (file: LocalUploadFile): Promise<void> => {
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: normalizeCosPostUploadUrl(file.uploadUrl!),
        filePath: file.localPath,
        name: file.fileFieldName || 'file',
        formData: stringifyCosFormData(file.formData),
        success: uploadRes => {
          if (uploadRes.statusCode >= 200 && uploadRes.statusCode < 300) {
            resolve()
            return
          }
          const body =
            typeof uploadRes.data === 'string' ? uploadRes.data.replace(/\s+/g, ' ').slice(0, 160) : ''
          reject(new Error(`COS 上传失败 (${uploadRes.statusCode})${body ? `: ${body}` : ''}`))
        },
        fail: err => {
          const errMsg = err.errMsg || 'COS 上传失败'
          if (/合法域名|url not in domain/i.test(errMsg)) {
            reject(
              new Error('未配置 COS 上传合法域名，请在微信公众平台添加 upload 域名')
            )
            return
          }
          reject(new Error(errMsg))
        }
      })
    })
  }

  const removeFile = (index: number) => {
    uploadFiles.value.splice(index, 1)
  }

  const retryUpload = (index: number) => {
    uploadSingleFile(index)
  }

  const resetUploads = () => {
    uploadFiles.value = []
  }

  return {
    uploadFiles,
    chooseImages,
    removeFile,
    retryUpload,
    resetUploads
  }
}
