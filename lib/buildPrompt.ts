/**
 * Build the prompt sent to Dify from parent form data.
 * Combines story (Your Life), color, style, and custom input.
 */

const STYLE_LABELS: Record<string, string> = {
  lion: "crowned lion in jungle, regal",
  portrait: "portrait sketch, woman face, artistic",
  collage: "collage with banner, tattty style, mixed elements",
  tattoos: "faces and tattoos banner, traditional",
  castle: "fantasy castle, detailed rendering",
  mandala: "circular mandala, intricate pattern",
  tribal: "abstract tribal symbol, sharp",
  demon: "horned demon face, stylized",
  cityscape: "city skyline sketch",
  horse: "galloping horse",
  zombie: "zombie face, ink splatter",
}

export function buildDifyPrompt(params: {
  story: string
  colorMode: "black_and_white" | "full_color"
  styleId?: string | null
  customStyle?: string
}): string {
  const parts: string[] = []

  if (params.story?.trim()) {
    parts.push(params.story.trim())
  }

  if (params.colorMode === "black_and_white") {
    parts.push("Black and white, monochrome, high contrast.")
  } else {
    parts.push("Full color, vibrant, rich colors.")
  }

  if (params.customStyle?.trim()) {
    parts.push(`Custom style: ${params.customStyle.trim()}`)
  } else if (params.styleId && STYLE_LABELS[params.styleId]) {
    parts.push(`Style: ${STYLE_LABELS[params.styleId]}`)
  }

  return parts.join(" ")
}
