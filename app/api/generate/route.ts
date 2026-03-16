import { NextRequest, NextResponse } from "next/server"
import Replicate from "replicate"
import { constructPayload } from "@/lib/payload"

const modelIdentifier =
  "tattzy25/tattty_4_all:4e8f6c1dc77db77dabaf98318cde3679375a399b434ae2db0e698804ac84919c"

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const prompt = formData.get("prompt") as string
  const image = formData.get("image") as string | null
  const mask = formData.get("mask") as string | null

  const input = constructPayload({
    prompt,
    image: image || undefined,
    mask: mask || undefined,
  })

  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  })

  try {
    const output = (await replicate.run(modelIdentifier, { input })) as unknown

    if (!output) {
      return NextResponse.json(
        { success: false, error: "No output received from Replicate" },
        { status: 502 }
      )
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

    return NextResponse.json({ success: true, output: serializedOutput })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
