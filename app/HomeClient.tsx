"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Info, Loader2, Download, Sparkles, Share2 } from "lucide-react"
import { GeneratedImagesGrid } from "./GeneratedImagesGrid"
import Lightbox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function LabelWithTooltip({ id, label, tooltip }: { id?: string, label: string, tooltip: string }) {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
        </PopoverTrigger>
        <PopoverContent className="w-auto max-w-xs text-sm">
          <p>{tooltip}</p>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function HomeContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareFile, setShareFile] = useState<File | null>(null)
  const [shareUrl, setShareUrl] = useState("")

  const [prompt, setPrompt] = useState("")
  const [images, setImages] = useState<string[]>([])
  const runningRef = useRef(false)

  const searchParams = useSearchParams()
  const isEmbed = searchParams.get("embed") === "1" || (typeof window !== "undefined" && window.self !== window.top)

  useEffect(() => {
    if (!isEmbed) return
    const handler = (event: MessageEvent) => {
      const msg = event.data
      if (msg?.type !== "GENERATE" || !msg.payload) return
      const { story, colorMode, styleId, customStyle, user } = msg.payload
      runGenerateFromEmbed({
        story: story ?? "",
        colorMode: colorMode ?? "full_color",
        styleId: styleId ?? null,
        customStyle: customStyle ?? "",
        user: user ?? `extend-${Date.now()}`,
      })
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [isEmbed])

  const runGenerateFromEmbed = async (payload: {
    story: string
    colorMode: string
    styleId: string | null
    customStyle: string
    user: string
  }) => {
    if (runningRef.current) return
    if (!payload.story?.trim()) {
      toast.error("No story/prompt received from parent page")
      return
    }
    setIsLoading(true)
    setGeneratedImages([])
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story: payload.story,
          colorMode: payload.colorMode,
          styleId: payload.styleId,
          customStyle: payload.customStyle,
          user: payload.user,
          trace_id: `extend-${Date.now()}`,
        }),
      })
      const result = await res.json()
      if (result.success && result.output) {
        setGeneratedImages(Array.isArray(result.output) ? (result.output as string[]) : [result.output as string])
      } else {
        toast.error(result.error ?? "Generation failed")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (isLoading) return
    if (!prompt.trim()) {
      toast.error("Please enter a prompt to generate an image")
      return
    }
    setIsLoading(true)
    setGeneratedImages([])
    const formData = new FormData()
    formData.append("prompt", prompt)
    for (const img of images) {
      if (img) formData.append("image", img)
    }
    try {
      const res = await fetch("/api/generate", { method: "POST", body: formData })
      const result = await res.json()
      if (result.success && result.output) {
        setGeneratedImages(Array.isArray(result.output) ? (result.output as string[]) : [result.output as string])
      } else {
        toast.error(result.error ?? "No output from generate")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (url: string, index: number) => {
    try {
      const filename = `generated-image-${index + 1}.webp`
      const response = await fetch(`/api/download?url=${encodeURIComponent(url)}&filename=${filename}`)
      if (!response.ok) throw new Error("Network response was not ok")
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
      toast.success("Image downloaded successfully")
    } catch (error) {
      console.error("Download failed:", error)
      toast.error("Download failed. Please try again.")
    }
  }

  const handleShare = async (url: string, index: number) => {
    const filename = `generated-image-${index + 1}.webp`
    setShareUrl(url)
    if (navigator.canShare && navigator.canShare({ files: [new File([], "test.png")] })) {
      toast.info("Preparing image for sharing...")
      try {
        const response = await fetch(`/api/download?url=${encodeURIComponent(url)}&filename=${filename}`)
        if (response.ok) {
          const blob = await response.blob()
          const file = new File([blob], filename, { type: blob.type })
          setShareFile(file)
          setShareDialogOpen(true)
          return
        }
      } catch {
        console.warn("File preparation failed")
      }
    }
    try {
      if (navigator.share) {
        await navigator.share({
          title: "TaTTTy Generation",
          text: "Check out this image I generated with TaTTTy.com!",
          url: url,
        })
        toast.success("Shared link successfully")
        return
      }
    } catch {
      console.warn("Link sharing failed")
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.info("Sharing failed, link copied to clipboard instead!")
    } catch {
      toast.error("Failed to share. Try downloading instead.")
    }
  }

  const handleDownloadAll = async (urls: string[]) => {
    for (let i = 0; i < urls.length; i++) {
      await handleDownload(urls[i], i)
    }
    toast.success("All images downloaded")
  }

  const handleShareAll = async (urls: string[]) => {
    if (urls.length === 0) return
    try {
      if (navigator.share) {
        await navigator.share({
          title: "TaTTTy Generation",
          text: `Check out these ${urls.length} images I generated with TaTTTy.com!`,
          url: urls[0],
        })
        toast.success("Shared successfully")
      } else {
        await navigator.clipboard.writeText(urls.join("\n"))
        toast.success("Links copied to clipboard")
      }
    } catch (err) {
      toast.error("Failed to share")
    }
  }

  const handleUploadAll = async (urls: string[]) => {
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: urls }),
      })
      if (res.ok) toast.success("All images uploaded")
      else toast.error("Upload failed")
    } catch {
      toast.error("Upload failed – check endpoint")
    }
  }

  const handleLike = async (url: string) => {
    try {
      await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      toast.success("Liked")
    } catch {
      toast.info("Like endpoint not configured")
    }
  }

  const handleUpload = async (url: string) => {
    try {
      await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      toast.success("Uploaded")
    } catch {
      toast.info("Upload endpoint not configured")
    }
  }

  const executeShare = async () => {
    if (!shareFile) return
    try {
      await navigator.share({
        title: "TaTTTy.com",
        text: "Check out this image I generated with TaTTTy.com!",
        files: [shareFile],
      })
      toast.success("Shared image successfully")
      setShareDialogOpen(false)
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setShareDialogOpen(false)
        return
      }
      if (shareUrl) {
        try {
          await navigator.share({
            title: "TaTTTy Generation",
            text: "Check out this image I generated with TaTTTy.com!",
            url: shareUrl,
          })
          setShareDialogOpen(false)
          return
        } catch {
          // ignore
        }
      }
      toast.error("Sharing failed. Try downloading instead.")
      setShareDialogOpen(false)
    }
  }

  const slides = generatedImages.map((src) => ({ src, width: 1024, height: 1024 }))

  return (
    <div className="flex flex-col w-full">
      {!isEmbed ? (
        <div className="w-full mx-auto py-4 px-3 sm:px-4 max-w-2xl space-y-3">
          <div className="space-y-1">
            <LabelWithTooltip
              id="prompt"
              label="Prompt"
              tooltip="If There Is No Question Above, Be Very Descriptive About Your Style, Color, And Desired Image"
            />
            <Textarea
              id="prompt"
              placeholder="Enter your prompt here..."
              className="h-24 min-h-0"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          <div className="flex justify-center">
            <Button
              size="lg"
              className={cn(
                "w-full max-w-md text-2xl py-6 h-auto transition-transform active:scale-95",
                isLoading && "opacity-50 cursor-not-allowed active:scale-100"
              )}
              onClick={handleGenerate}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  CREATING...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-6 w-6" />
                  CREATE
                  <Sparkles className="ml-2 h-6 w-6" />
                </>
              )}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col items-center py-6">
        <GeneratedImagesGrid
          images={generatedImages}
          isLoading={isLoading}
          onDownload={handleDownload}
          onShare={handleShare}
          onLike={handleLike}
          onUpload={handleUpload}
          onDownloadAll={handleDownloadAll}
          onShareAll={handleShareAll}
          onUploadAll={handleUploadAll}
          onImageClick={(i) => {
            setLightboxIndex(i)
            setLightboxOpen(true)
          }}
        />
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={slides}
      />

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ready to Share</DialogTitle>
            <DialogDescription>
              Your image has been prepared. Click the button below to share it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>Cancel</Button>
            <Button onClick={executeShare}>Share Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function HomeClient() {
  return <HomeContent />
}
