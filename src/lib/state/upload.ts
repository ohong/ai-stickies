import { observable, computed } from '@legendapp/state'

export const uploadState$ = observable({
  uploadedImage: null as File | null,
  previewUrl: '',
  isUploading: false,
  uploadProgress: 0,
  error: null as string | null,
  uploadId: '',
})

// Computed: Is there an uploaded image?
export const hasUploadedImage$ = computed(() => {
  return uploadState$.uploadedImage.get() !== null
})

// Computed: File size in MB
export const fileSizeMB$ = computed(() => {
  const file = uploadState$.uploadedImage.get()
  if (!file) return 0
  return Math.round((file.size / 1024 / 1024) * 100) / 100
})

// Computed: Is file too large? (>10MB)
export const isFileTooLarge$ = computed(() => {
  const file = uploadState$.uploadedImage.get()
  if (!file) return false
  return file.size > 10 * 1024 * 1024
})

// Computed: Upload progress percentage
export const uploadProgressPercentage$ = computed(() => {
  return Math.round(uploadState$.uploadProgress.get())
})

// Computed: Can trigger generation (has upload + not uploading)
export const canGenerateUpload$ = computed(() => {
  return uploadState$.uploadedImage.get() !== null && 
         !uploadState$.isUploading.get() &&
         uploadState$.previewUrl.get() !== ''
})

// Actions
export const uploadActions = {
  startUpload: (file: File) => {
    uploadState$.uploadedImage.set(file)
    uploadState$.isUploading.set(true)
    uploadState$.uploadProgress.set(0)
    uploadState$.error.set(null)
  },

  updateProgress: (progress: number) => {
    uploadState$.uploadProgress.set(progress)
  },

  setUploadId: (id: string) => {
    uploadState$.uploadId.set(id)
  },

  setPreviewUrl: (url: string) => {
    uploadState$.previewUrl.set(url)
  },

  setError: (error: string | null) => {
    uploadState$.error.set(error)
    uploadState$.isUploading.set(false)
  },

  completeUpload: (uploadId: string, previewUrl: string) => {
    uploadState$.uploadId.set(uploadId)
    uploadState$.previewUrl.set(previewUrl)
    uploadState$.isUploading.set(false)
    uploadState$.uploadProgress.set(100)
  },

  reset: () => {
    uploadState$.uploadedImage.set(null)
    uploadState$.previewUrl.set('')
    uploadState$.isUploading.set(false)
    uploadState$.uploadProgress.set(0)
    uploadState$.error.set(null)
    uploadState$.uploadId.set('')
  },
}