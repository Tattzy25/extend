"use server"

export async function generateImage(formData: FormData) {
  const prompt = formData.get("prompt") as string
  const image = formData.get("image") as string | null

  return { success: false, error: "Generation not available" }
}
