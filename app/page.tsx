"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { InkMeUpButton } from "@/components/InkMeUpButton"
import {
  File as FileIcon,
  Image as ImageIcon,
  Info,
  Sparkles,
  X,
} from "lucide-react"
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

const MAX_PROMPT_LENGTH = 4000
const ideaPrompts = [
  "A futuristic cityscape at sunset with flying cars",
  "A serene mountain landscape with aurora borealis",
  "An underwater temple surrounded by bioluminescent creatures",
  "A cozy library filled with floating books and warm lighting",
  "A cyberpunk marketplace bustling with activity",
  "A peaceful forest with towering ancient trees",
  "A space station overlooking multiple planets",
  "A magical garden with glowing flora",
]

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

  // UI State (new prompt input UI)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [typing, setTyping] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])

  const promptLength = prompt.length
  const canSubmit = prompt.trim().length > 0 && !isLoading

  const charCounterClass = useMemo(() => {
    if (promptLength > MAX_PROMPT_LENGTH * 0.9) return "text-red-500"
    if (promptLength > MAX_PROMPT_LENGTH * 0.75) return "text-amber-500"
    return "text-slate-300"
  }, [promptLength])

  // autosize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 300) + "px"
  }, [prompt])

  // typing indicator
  useEffect(() => {
    if (prompt.length === 0) {
      setTyping(false)
      return
    }
    setTyping(true)
    const t = window.setTimeout(() => setTyping(false), 1000)
    return () => window.clearTimeout(t)
  }, [prompt])

  // Ctrl/⌘ + Enter shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        if (!canSubmit) return
        e.preventDefault()
        handleGenerate()
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSubmit, prompt, style, color, customColor, isLoading])

  const onPickImages = () => fileInputRef.current?.click()
  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length) setAttachedFiles((prev) => [...prev, ...files])
    // allow selecting same file again
    e.target.value = ""
  }
  const removeFileAt = (idx: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))
  }
  const onInspire = () => {
    const randomIdea = ideaPrompts[Math.floor(Math.random() * ideaPrompts.length)]
    setPrompt(randomIdea)
    textareaRef.current?.focus()
  }

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
    <div className="flex flex-col w-full min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      <div className="container mx-auto py-6 px-4 sm:px-6 max-w-2xl space-y-3">
        <div className="space-y-2">
          <LabelWithTooltip
            id="promptInput"
            label="Prompt"
            tooltip="If There Is No Question Above, Be Very Descriptive About Your Style, Color, And Desired Image"
          />

          {/* New prompt input UI (from newui.html) */}
          <div className="w-full max-w-2xl animate-fade-in">
            <div className="prompt-container relative rounded-3xl p-1">
              <div className="glow-ring" />

              <div className="bg-white rounded-[22px] p-4">
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-slate-100">
                    {attachedFiles.map((file, idx) => {
                      const fileName =
                        file.name.length > 15
                          ? file.name.substring(0, 12) + "..."
                          : file.name
                      return (
                        <div
                          key={`${file.name}-${idx}`}
                          className="file-chip flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-xs font-medium"
                        >
                          <FileIcon className="w-4 h-4" aria-hidden="true" />
                          <span>{fileName}</span>
                          <button
                            type="button"
                            className="ml-1 hover:text-indigo-900 transition-colors"
                            onClick={() => removeFileAt(idx)}
                            aria-label={`Remove ${file.name}`}
                          >
                            <X className="w-3 h-3" aria-hidden="true" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={onFileChange}
                />

                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    id="promptInput"
                    className="prompt-textarea w-full min-h-[120px] max-h-[300px] text-slate-700 text-[15px] leading-relaxed outline-none placeholder:font-light bg-transparent resize-none"
                    placeholder="Describe your vision in detail..."
                    maxLength={MAX_PROMPT_LENGTH}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />

                  <div
                    className={`typing-indicator absolute bottom-2 left-0 ${typing ? "active" : ""}`}
                    aria-hidden={!typing}
                  >
                    <div className="typing-dot" />
                    <div className="typing-dot" style={{ animationDelay: "0.2s" }} />
                    <div className="typing-dot" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      id="imageBtn"
                      className="action-btn text-slate-500 hover:text-slate-700 transition-colors"
                      title="Add image"
                      type="button"
                      onClick={onPickImages}
                    >
                      <ImageIcon className="w-6 h-6" aria-hidden="true" />
                    </button>

                    <div className="w-px h-6 bg-slate-300 mx-1" />

                    <button
                      id="sparkleBtn"
                      className="action-btn text-slate-500 hover:text-slate-700 transition-colors"
                      title="Get inspiration"
                      type="button"
                      onClick={onInspire}
                    >
                      <Sparkles className="w-6 h-6" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`char-counter text-xs font-light tabular-nums ${charCounterClass}`}
                    >
                      {promptLength.toLocaleString()} / {MAX_PROMPT_LENGTH.toLocaleString()}
                    </span>
                  </div>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Tip: press Ctrl/⌘ + Enter to generate.
                </p>
              </div>
            </div>
          </div>

          {/* Restore your original button */}
          <div className="flex justify-center" style={{ marginTop: 20 }}>
            <InkMeUpButton onClick={handleGenerate} isLoading={isLoading} disabled={!canSubmit} />
          </div>
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

      {/* UI-only CSS (ported from newui.html). Kept local so we don’t add new files. */}
      <style jsx global>{`
        .prompt-container {
          background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.03), 0 2px 4px rgba(0, 0, 0, 0.02),
            0 8px 16px rgba(0, 0, 0, 0.04), 0 24px 48px rgba(0, 0, 0, 0.04);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .prompt-container:focus-within {
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15), 0 4px 8px rgba(99, 102, 241, 0.08),
            0 16px 32px rgba(99, 102, 241, 0.12), 0 32px 64px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }
        .prompt-textarea {
          scrollbar-width: thin;
          scrollbar-color: #e2e8f0 transparent;
        }
        .prompt-textarea::-webkit-scrollbar {
          width: 4px;
        }
        .prompt-textarea::-webkit-scrollbar-track {
          background: transparent;
        }
        .prompt-textarea::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 4px;
        }
        .prompt-textarea::placeholder {
          color: #94a3b8;
          transition: color 0.3s ease;
        }
        .prompt-textarea:focus::placeholder {
          color: #cbd5e1;
        }
        .submit-btn {
          background: linear-gradient(135deg, #1f2937 0%, #111827 50%, #000000 100%);
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 0, 0, 0.3);
        }
        .submit-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5), 0 0 28px rgba(0, 0, 0, 0.4);
        }
        .submit-btn:active {
          transform: scale(0.98);
        }
        .submit-btn:disabled {
          opacity: 0.9;
          cursor: not-allowed;
        }
        @keyframes gradient-shift {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .glow-ring {
          position: absolute;
          inset: -2px;
          border-radius: 28px;
          background: linear-gradient(135deg, #1f2937, #111827, #000000, #1f2937);
          background-size: 400% 400%;
          opacity: 0.25;
          z-index: -1;
          filter: blur(8px);
          transition: opacity 0.4s ease;
          animation: glow-rotate 4s linear infinite;
        }
        .prompt-container:focus-within .glow-ring {
          opacity: 0.4;
        }
        @keyframes glow-rotate {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 8px 12px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .typing-indicator.active {
          opacity: 1;
        }
        .typing-dot {
          width: 6px;
          height: 6px;
          background: #6366f1;
          border-radius: 50%;
          animation: typing-bounce 1.4s ease-in-out infinite;
        }
        @keyframes typing-bounce {
          0%,
          60%,
          100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-6px);
          }
        }
        .file-chip {
          animation: chip-in 0.3s ease forwards;
        }
        @keyframes chip-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease forwards;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
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
