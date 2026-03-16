"use client"

import Image from "next/image"
import { Download, Loader2, Share2, Heart, Upload } from "lucide-react"

const LIKE_ENDPOINT = "/api/like"
const UPLOAD_ENDPOINT = "/api/upload"

interface GeneratedImagesGridProps {
  images: string[]
  isLoading?: boolean
  onDownload: (url: string, index: number) => void
  onShare: (url: string, index: number) => void
  onLike?: (url: string, index: number) => void
  onUpload?: (url: string, index: number) => void
  onDownloadAll?: (urls: string[]) => void
  onShareAll?: (urls: string[]) => void
  onUploadAll?: (urls: string[]) => void
  onImageClick: (index: number) => void
}

export function GeneratedImagesGrid({
  images,
  isLoading = false,
  onDownload,
  onShare,
  onLike,
  onUpload,
  onDownloadAll,
  onShareAll,
  onUploadAll,
  onImageClick,
}: GeneratedImagesGridProps) {
  const handleLike = (url: string, index: number) => {
    if (onLike) {
      onLike(url, index)
    } else {
      // Default: call placeholder endpoint
      fetch(LIKE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, index }),
      }).catch(() => {})
    }
  }

  const handleUpload = (url: string, index: number) => {
    if (onUpload) {
      onUpload(url, index)
    } else {
      // Default: call placeholder endpoint
      fetch(UPLOAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, index }),
      }).catch(() => {})
    }
  }

  const iconBtnBase =
    "relative p-2.5 touch-manipulation focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 rounded group/btn transition-colors"
  const iconCommon =
    "h-7 w-7 [&>svg]:drop-shadow-[0_1px_3px_rgba(0,0,0,0.25)]"
  const tooltipClass =
    "absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1.5 text-xs font-medium text-white bg-black/90 rounded shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover/btn:opacity-100 transition-opacity duration-150 z-10"

  const pillClass =
    "font-[family-name:var(--font-orbitron)] bg-black text-white hover:bg-black/90 px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 touch-manipulation focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"

  if (isLoading) {
    return (
      <div className="w-full max-w-[1400px] mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <div
                className="relative overflow-hidden flex items-center justify-center w-full border border-border/50 aspect-square bg-muted/30 rounded-lg"
                data-slot="loading-slot"
              >
                <div className="absolute inset-0 backdrop-blur-md bg-muted/50" />
                <Loader2
                  className="h-10 w-10 animate-spin text-muted-foreground relative z-10"
                  aria-hidden="true"
                />
              </div>
              <div className="flex justify-center gap-1">
                <div className="h-8 w-8 rounded" />
                <div className="h-8 w-8 rounded" />
                <div className="h-8 w-8 rounded" />
                <div className="h-8 w-8 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {images.map((src, i) => (
          <div key={i} className="flex flex-col gap-2 group">
            <div
              className="relative overflow-hidden flex items-center justify-center w-full border border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer aspect-square bg-muted/20 rounded-lg"
              onClick={() => onImageClick(i)}
            >
              <Image
                src={src}
                alt={`Generated image ${i + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                unoptimized
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </div>
            <div className="flex justify-center gap-1 min-h-[44px] items-center" data-slot="individual-actions">
              <button
                type="button"
                className={`${iconBtnBase} text-red-600 hover:text-red-700`}
                onClick={(e) => {
                  e.stopPropagation()
                  handleLike(src, i)
                }}
                aria-label="Save to Gallery"
              >
                <span className={tooltipClass}>Save to Gallery</span>
                <Heart
                  className={`${iconCommon} fill-red-600 stroke-red-700 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]`}
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                className={`${iconBtnBase} text-[#0a0a0a] hover:text-black`}
                onClick={(e) => {
                  e.stopPropagation()
                  onShare(src, i)
                }}
                aria-label="Share"
              >
                <span className={tooltipClass}>Share</span>
                <Share2 className={iconCommon} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`${iconBtnBase} text-[#0a0a0a] hover:text-black`}
                onClick={(e) => {
                  e.stopPropagation()
                  onDownload(src, i)
                }}
                aria-label="Download"
              >
                <span className={tooltipClass}>Download</span>
                <Download className={iconCommon} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`${iconBtnBase} text-[#0a0a0a] hover:text-black`}
                onClick={(e) => {
                  e.stopPropagation()
                  handleUpload(src, i)
                }}
                aria-label="Spotlight"
              >
                <span className={tooltipClass}>Spotlight</span>
                <Upload className={iconCommon} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {images.length > 0 && (
        <div className="flex justify-center gap-3 mt-4 flex-wrap" data-slot="bulk-actions">
          <button
            type="button"
            className={pillClass}
            onClick={() => onDownloadAll?.(images)}
            aria-label="Download all"
          >
            <Download className="h-5 w-5" aria-hidden="true" />
            <span>All</span>
          </button>
          <button
            type="button"
            className={pillClass}
            onClick={() => onShareAll?.(images)}
            aria-label="Share all"
          >
            <Share2 className="h-5 w-5" aria-hidden="true" />
            <span>All</span>
          </button>
          <button
            type="button"
            className={pillClass}
            onClick={() => onUploadAll?.(images)}
            aria-label="Upload all"
          >
            <Upload className="h-5 w-5" aria-hidden="true" />
            <span>All</span>
          </button>
        </div>
      )}
    </div>
  )
}
