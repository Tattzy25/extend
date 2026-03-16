"use client"

import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Info, Loader2, Download, Upload, X, Sparkles, Share2, Edit } from "lucide-react"
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

function MultiImageUploadInput({
  id,
  values,
  onChange,
  label,
  tooltip,
  maxFiles = 4,
}: {
  id: string
  values: string[]
  onChange: (vals: string[], fileNames?: string[]) => void
  label: string
  tooltip: string
  maxFiles?: number
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [localFileNames, setLocalFileNames] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, Math.max(0, maxFiles - values.length))

    if (fileArray.length === 0) return

    const readers = fileArray.map(
      (file) =>
        new Promise<{ dataUrl: string; name: string }>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve({ dataUrl: reader.result as string, name: file.name })
          reader.onerror = () => reject(new Error("Failed to read file"))
          reader.readAsDataURL(file)
        })
    )

    Promise.all(readers)
      .then((results) => {
        const nextValues = [...values, ...results.map((r) => r.dataUrl)].slice(0, maxFiles)
        const nextNames = [...localFileNames, ...results.map((r) => r.name)].slice(0, maxFiles)
        setLocalFileNames(nextNames)
        onChange(nextValues, nextNames)
      })
      .catch(() => {
        toast.error("Failed to read file. Please try again.")
      })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files?.length) {
      addFiles(files)
      const rejected = Array.from(files).some((f) => !f.type.startsWith("image/"))
      if (rejected) toast.error("Please upload valid image files (JPG, PNG, GIF)")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files?.length) addFiles(files)
    // allow re-selecting the same file
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleRemoveAt = (idx: number) => {
    const nextValues = values.filter((_, i) => i !== idx)
    const nextNames = localFileNames.filter((_, i) => i !== idx)
    setLocalFileNames(nextNames)
    onChange(nextValues, nextNames)
  }

  const canAddMore = values.length < maxFiles

  return (
    <div className="space-y-2">
      <LabelWithTooltip id={id} label={label} tooltip={tooltip} />

      {values.length > 0 && (
<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {values.map((src, idx) => (
            <div key={idx} className="relative overflow-hidden rounded-lg border bg-muted/30">
              <img src={src} alt={`Upload preview ${idx + 1}`} className="h-24 w-full object-cover rounded-lg" />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute right-1 top-1 h-7 px-2"
                onClick={() => handleRemoveAt(idx)}
                aria-label={`Remove uploaded image ${idx + 1}`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
              <div className="px-2 py-1">
                <div className="truncate text-xs text-muted-foreground">
                  {localFileNames[idx] || `Image ${idx + 1}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className={cn(
          "relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-4 text-center transition-colors hover:bg-muted/50",
          isDragging && "border-primary bg-muted",
          !canAddMore && "cursor-not-allowed opacity-60 hover:bg-transparent"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!canAddMore) return
          fileInputRef.current?.click()
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (!canAddMore) return
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click()
        }}
        aria-disabled={!canAddMore}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-full bg-background p-3 shadow-sm">
            <Upload className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            <span className="font-semibold text-foreground">Click to upload</span> or drag and drop
          </div>
          <div className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF • up to {maxFiles}</div>
          {!canAddMore && <div className="text-xs text-muted-foreground">Max {maxFiles} images selected</div>}
        </div>
      </div>

      <input
        id={id}
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        multiple
        onChange={handleFileChange}
      />
    </div>
  )
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  
  // Share State
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareFile, setShareFile] = useState<File | null>(null)
  const [shareUrl, setShareUrl] = useState("")

  // Form State
  const [prompt, setPrompt] = useState("")
  const [images, setImages] = useState<string[]>([])

  const handleGenerate = async () => {
    if (isLoading) return // Prevent double clicks
    
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
      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      })
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
      if (!response.ok) throw new Error('Network response was not ok')
      
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
      toast.success("Image downloaded successfully")
    } catch (error) {
      console.error('Download failed:', error)
      toast.error("Download failed. Please try again.")
    }
  }

  const handleShare = async (url: string, index: number) => {
    const filename = `generated-image-${index + 1}.webp`
    setShareUrl(url)
    
      if (navigator.canShare && navigator.canShare({ files: [new File([], 'test.png')] })) {
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
        } catch (error) {
          console.warn("File preparation failed", error)
        }
      }

    // Fallback to Link Sharing immediately if file sharing isn't supported or failed
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'TaTTTy AI Generation',
          text: 'Check out this image I generated with GoKAnI AI!',
          url: url
        })
        toast.success("Shared link successfully")
        return
      }
    } catch (error) {
      console.warn("Link sharing failed", error)
    }

    // Fallback to Clipboard
    try {
      await navigator.clipboard.writeText(url)
      toast.info("Sharing failed, link copied to clipboard instead!")
    } catch {
      toast.error("Failed to share. Try downloading instead.")
    }
  }

  const executeShare = async () => {
    if (!shareFile) return
    
    try {
      await navigator.share({
        title: 'GoKAnI AI Generation',
        text: 'Check out this image I generated with GoKAnI AI!',
        files: [shareFile]
      })
      toast.success("Shared image successfully")
      setShareDialogOpen(false)
    } catch (error) {
      console.warn("Share execution failed", error)
      
      // If user cancelled, just close dialog
      if (error instanceof Error && error.name === 'AbortError') {
        setShareDialogOpen(false)
        return
      }

      // Fallback to link sharing
      if (shareUrl) {
        try {
          await navigator.share({
            title: 'GoKAnI AI Generation',
            text: 'Check out this image I generated with GoKAnI AI!',
            url: shareUrl
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

  const slides = generatedImages.map((src) => ({
    src,
    width: 1024,
    height: 1024,
  }))

  return (
    <div className="flex flex-col w-full">
      <div className="container mx-auto py-10 px-4 space-y-12 max-w-6xl">
        <div className="grid grid-cols-1 gap-6">
        <Card className="h-full border-2">
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <LabelWithTooltip
                  id="prompt"
                  label="Prompt"
                  tooltip="If There Is No Question Above, Be Very Descriptive About Your Style, Color, And Desired Image"
                />
              </div>
              <Textarea
                id="prompt"
                placeholder="Enter your prompt here..."
                className="h-24"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <Separator className="my-2" />

            <div className="space-y-4">
              <MultiImageUploadInput
                id="image_url"
                label="Image (Optional)"
                tooltip="Upload Images For Editing, Cover Ups, & Extensions."
                values={images}
                onChange={(vals) => {
                  setImages(vals)
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button 
          size="lg" 
          className={cn(
            "w-full max-w-md text-3xl py-8 h-auto transition-transform active:scale-95",
            isLoading && "opacity-50 cursor-not-allowed active:scale-100"
          )}
          onClick={handleGenerate}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-3 h-8 w-8 animate-spin" />
              CREATING...
            </>
          ) : (
            <>
              <Sparkles className="mr-3 h-8 w-8" />
              CREATE
              <Sparkles className="ml-3 h-8 w-8" />
            </>
          )}
        </Button>
      </div>

      <Separator />
      
      <div className="flex flex-col items-center pb-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Creating your masterpiece...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {generatedImages.map((src, i) => (
              <div key={i} className="flex flex-col gap-3 group">
                <div 
                  className="relative rounded-xl overflow-hidden flex items-center justify-center w-full border border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer aspect-square bg-muted/20"
                  onClick={() => {
                    setLightboxIndex(i)
                    setLightboxOpen(true)
                  }}
                >
                  <img 
                    src={src} 
                    alt={`Generated image ${i + 1}`} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>
                <div className="flex gap-2 w-full">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 h-9 rounded-lg"
                    onClick={() => handleDownload(src, i)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 h-9 rounded-lg"
                    onClick={() => handleShare(src, i)}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 h-9 rounded-lg"
                    onClick={() => {
                      if (images.length < 4) {
                        setImages([...images, src])
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                        toast.success("Added to workspace for editing")
                      } else {
                        toast.error("Workspace is full (max 4 images)")
                      }
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
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
    </div>
  )
}