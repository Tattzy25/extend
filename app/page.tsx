"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Info } from "lucide-react"
import { InkMeUpButton } from "@/components/InkMeUpButton"
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

const GENERATE_URL = "https://TaTTTy--61d298c4216911f1bea342dde27851f2.web.val.run/generate"
const RESULT_URL = "https://TaTTTy--61d298c4216911f1bea342dde27851f2.web.val.run/result"
const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 60

const ERR_NETWORK = "Please check your network connection."
const ERR_SERVER = "Server error. Please try again later."

async function readJsonSafe(
  res: Response
): Promise<{ ok: true; json: unknown } | { ok: false; text: string }> {
  const text = await res.text().catch(() => "")
  try {
    return { ok: true, json: text ? JSON.parse(text) : null }
  } catch {
    return { ok: false, text }
  }
}

function HomeContent() {
  const searchParams = useSearchParams()
  const style = searchParams.get("style") ?? "Blackwork"
  const color = searchParams.get("color") ?? "Black & White"
  const customColor = searchParams.get("customColor") || null

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

  // (Removed mount/isLoading debug posts; they were firing on renders/keystrokes in embeds.)

  const handleGenerate = async () => {
    if (isLoading) return
    const trimmed = prompt.trim()
    if (!trimmed) {
      toast.error("Please answer the question.")
      return
    }
    if (trimmed.length < 20) {
      toast.error("Please enter at least 20 characters.")
      return
    }
    setIsLoading(true)
    setGeneratedImages([])

    // #region agent log
    fetch('/api/debug',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'07ef70',runId:'pre-fix',hypothesisId:'H_request',location:'app/page.tsx:handleGenerate(start)',message:'generate start',data:{style,color,hasCustomColor:!!customColor,href:typeof window!=='undefined'?window.location.href:null,isIframe:typeof window!=='undefined'?window.self!==window.top:null,referrer:typeof document!=='undefined'?document.referrer:null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    try {
      // Call external generator directly (bypasses /api/generate 404s on deploy)
      const generateRes = await fetch(GENERATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style, color, prompt: trimmed, customColor }),
      })

      // #region agent log
      fetch('/api/debug',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'07ef70',runId:'pre-fix',hypothesisId:'H_request',location:'app/page.tsx:handleGenerate(generateRes)',message:'generate response meta',data:{ok:generateRes.ok,status:generateRes.status,contentType:generateRes.headers.get('content-type')},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      if (!generateRes.ok) {
        const text = await generateRes.text().catch(() => "")
        toast.error(text || "Something went wrong. Please try again.")
        setIsLoading(false)
        return
      }

      const parsedGenerate = await readJsonSafe(generateRes)
      if (!parsedGenerate.ok) {
        const snippet = parsedGenerate.text.slice(0, 160)
        toast.error(`Generator returned invalid JSON: ${snippet || "(empty response)"}`)
        setIsLoading(false)
        return
      }

      const generateJson = parsedGenerate.json as { prediction_id?: string } | null
      const predictionId = generateJson?.prediction_id
      if (!predictionId) {
        toast.error("No prediction_id returned. Please try again.")
        setIsLoading(false)
        return
      }

      // #region agent log
      fetch('/api/debug',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'07ef70',runId:'pre-fix',hypothesisId:'H_request',location:'app/page.tsx:handleGenerate(predictionId)',message:'prediction id received',data:{hasPredictionId:!!predictionId},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      let attempts = 0
      let images: string[] = []

      while (attempts < MAX_POLL_ATTEMPTS) {
        attempts += 1
        try {
          const resultRes = await fetch(`${RESULT_URL}?id=${encodeURIComponent(predictionId)}`)
          if (!resultRes.ok) {
            const text = await resultRes.text().catch(() => "")
            throw new Error(text || `HTTP ${resultRes.status}`)
          }
          const parsedResult = await readJsonSafe(resultRes)
          if (!parsedResult.ok) {
            const snippet = parsedResult.text.slice(0, 160)
            throw new Error(`Result returned invalid JSON: ${snippet || "(empty response)"}`)
          }
          const resultJson = parsedResult.json as { status?: string; images?: unknown } | null
          if (resultJson?.status === "succeeded") {
            images = Array.isArray(resultJson.images) ? (resultJson.images as string[]) : []
            break
          }
          if (resultJson?.status === "failed") {
            throw new Error("Generation failed")
          }
        } catch {
          // network or transient error; fall through to retry until max attempts
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
      }

      // #region agent log
      fetch('/api/debug',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'07ef70',runId:'pre-fix',hypothesisId:'H_loading',location:'app/page.tsx:handleGenerate(done)',message:'generation finished',data:{attempts,imagesCount:images.length},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      if (!images.length) {
        toast.error(ERR_SERVER)
      } else {
        setGeneratedImages(images)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ERR_NETWORK)
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
    } catch {
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
        } catch {
          toast.error("Could not prepare image for sharing. Please try downloading instead.")
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
    } catch {
      toast.error("Link sharing failed. Please try again.")
    }

    // Fallback to Clipboard
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
          title: "GoKAnI AI Generation",
          text: `Check out these ${urls.length} images I generated!`,
          url: urls[0],
        })
        toast.success("Shared successfully")
      } else {
        await navigator.clipboard.writeText(urls.join("\n"))
        toast.success("Links copied to clipboard")
      }
    } catch {
      toast.error("Failed to share")
    }
  }

  const handleUploadAll = async (urls: string[]) => {
    const UPLOAD_ALL_ENDPOINT = "/api/upload" // placeholder – replace with your destination
    try {
      const res = await fetch(UPLOAD_ALL_ENDPOINT, {
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
    const LIKE_ENDPOINT = "/api/like" // placeholder – replace with your destination
    try {
      await fetch(LIKE_ENDPOINT, {
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
    const UPLOAD_ENDPOINT = "/api/upload" // placeholder – replace with your destination
    try {
      await fetch(UPLOAD_ENDPOINT, {
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
        title: 'GoKAnI AI Generation',
        text: 'Check out this image I generated with GoKAnI AI!',
        files: [shareFile]
      })
      toast.success("Shared image successfully")
      setShareDialogOpen(false)
    } catch (error) {
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
          toast.error("Link sharing failed. Try downloading instead.")
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
    <div className="flex flex-col w-full min-h-screen bg-transparent">
      <div className="container mx-auto py-4 px-4 sm:px-6 max-w-2xl space-y-3">
        <div className="space-y-1">
          <LabelWithTooltip
            id="prompt"
            label="Prompt"
            tooltip="If There Is No Question Above, Be Very Descriptive About Your Style, Color, And Desired Image"
          />
          <Textarea
            id="prompt"
            placeholder="There is no right or wrong answer."
            className="h-24 min-h-0 min-w-0"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="flex justify-center" style={{ marginTop: 20 }}>
          <InkMeUpButton
            onClick={handleGenerate}
            isLoading={isLoading}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex flex-col items-center py-4 sm:py-6 px-2 sm:px-0">
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

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  )
}
