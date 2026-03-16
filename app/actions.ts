"use server"

import Replicate from "replicate"
import { constructPayload } from "@/lib/payload"

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export async function generateImage(formData: FormData) {
  const prompt = formData.get("prompt") as string
  const image = formData.get("image") as string | null
  const mask = formData.get("mask") as string | null

  const modelIdentifier = "tattzy25/tattty_4_all:4e8f6c1dc77db77dabaf98318cde3679375a399b434ae2db0e698804ac84919c"
  const input = constructPayload({
    prompt,
    image: image || undefined,
    mask: mask || undefined,
  })

  try {
    const output = await replicate.run(modelIdentifier, { input }) as unknown

    if (!output) {
      return { success: false, error: "No output received from Replicate" }
    }

    const processOutput = (item: unknown): string => {
      if (typeof item === "string") return item
      if (item && typeof item === "object" && "url" in item) {
        const urlVal = (item as { url: unknown }).url
        if (typeof urlVal === "function") return (urlVal as () => URL)().toString()
        if (urlVal != null) return String(urlVal)
      }
      return String(item)
    }

    const serializedOutput = Array.isArray(output)
      ? (output as unknown[]).map(processOutput)
      : [processOutput(output)]

    return { success: true, output: serializedOutput }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}
