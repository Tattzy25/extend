"use client"

import { Button } from "@/components/ui/button"
import { Download, Loader2, Share2 } from "lucide-react"

interface GeneratedImagesGridProps {
  images: string[]
  isLoading?: boolean
  onDownload: (url: string, index: number) => void
  onShare: (url: string, index: number) => void
  onImageClick: (index: number) => void
}

export function GeneratedImagesGrid({
  images,
  isLoading = false,
  onDownload,
  onShare,
  onImageClick,
}: GeneratedImagesGridProps) {
  if (isLoading) {
    return (
      <div className="w-full max-w-[1400px] mx-auto px-4">
        <div className="grid grid-cols-4 gap-3">
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
              <div className="h-9 rounded-lg bg-muted/30 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4">
      <div className="grid grid-cols-4 gap-3">
        {images.map((src, i) => (
          <div key={i} className="flex flex-col gap-2 group">
            <div
              className="relative overflow-hidden flex items-center justify-center w-full border border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer aspect-square bg-muted/20 rounded-lg"
              onClick={() => onImageClick(i)}
            >
              <img
                src={src}
                alt={`Generated image ${i + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 h-9 rounded-lg"
                onClick={() => onDownload(src, i)}
              >
                <Download className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 h-9 rounded-lg"
                onClick={() => onShare(src, i)}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
