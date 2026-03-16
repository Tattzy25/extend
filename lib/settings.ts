export interface DimensionsQualitySettings {
  aspectRatio: string
  outputFormat: string
  width: number
  height: number
  megapixels: string
  outputQuality: number
}

export const defaultDimensionsQualitySettings: DimensionsQualitySettings = {
  aspectRatio: "1:1",
  outputFormat: "webp",
  width: 1024,
  height: 1024,
  megapixels: "1",
  outputQuality: 80
}

export interface AdvancedGenerationSettings {
  guidanceScale: number
  numInferenceSteps: number
  seed: number | undefined
  goFast: boolean
  disableSafetyChecker: boolean
  extraLora: string
  loraScale: number
  extraLoraScale: number
  promptStrength: number
  numOutputs: number
  model: string
  outputFormat: string
  megapixels: string
  outputQuality: number
  aspectRatio: string
  width: number
  height: number
  images: string[]
  imageFileNames: string[]
  mask: string
  maskFileName: string
  shareDialogOpen: boolean
  shareFile: File | null
  shareUrl: string
  isPreparingShare: boolean
  lightboxOpen: boolean
  lightboxIndex: number
  generatedImages: string[]
  isGenerated: boolean
  isLoading: boolean
}

export const defaultAdvancedGenerationSettings: AdvancedGenerationSettings = {
  guidanceScale: 3,
  numInferenceSteps: 28,
  seed: undefined,
  goFast: false,
  disableSafetyChecker: true, // Set to true as requested
  extraLora: "",
  loraScale: 2, // Set to 2 as requested
  extraLoraScale: 1,
  promptStrength: 0.8,
  numOutputs: 4,
  model: "dev",
  outputFormat: "webp",
  megapixels: "1",
  outputQuality: 80,
  aspectRatio: "1:1",
  width: 1024,
  height: 1024,
  images: [],
  imageFileNames: [],
  mask: "",
  maskFileName: "",
  shareDialogOpen: false,
  shareFile: null,
  shareUrl: "",
  isPreparingShare: false,
  lightboxOpen: false,
  lightboxIndex: 0,
  generatedImages: [],
  isGenerated: false,
  isLoading: false
}

export const aspectRatioOptions = [
  { value: "1:1", label: "1:1" },
  { value: "16:9", label: "16:9" },
  { value: "21:9", label: "21:9" },
  { value: "3:2", label: "3:2" },
  { value: "2:3", label: "2:3" },
  { value: "4:5", label: "4:5" },
  { value: "5:4", label: "5:4" },
  { value: "3:4", label: "3:4" },
  { value: "4:3", label: "4:3" },
  { value: "9:16", label: "9:16" },
  { value: "9:21", label: "9:21" },
  { value: "custom", label: "Custom" }
]

export const formatOptions = [
  { value: "webp", label: "WebP" },
  { value: "jpg", label: "JPG" },
  { value: "png", label: "PNG" }
]

export const megapixelOptions = [
  { value: "1", label: "1 MP" },
  { value: "0.25", label: "0.25 MP" }
]