import { ReplicateInput } from "./types";

/**
 * Constructs the payload for the Replicate API.
 * This file contains ONLY the logic for what data is fired out to the API.
 */
export function constructPayload(params: {
  prompt: string;
  images?: string[];
  mask?: string;
}): ReplicateInput {
  const payload: ReplicateInput = {
    prompt: params.prompt,
    model: "dev",
    aspect_ratio: "1:1",
    output_format: "webp",
    num_outputs: 4,
    megapixels: "1",
    output_quality: 80,
    guidance_scale: 3,
    num_inference_steps: 28,
    go_fast: false,
    disable_safety_checker: true,
    prompt_strength: 0.8,
    lora_scale: 1,
    extra_lora_scale: 1,
  };

  const image = params.images?.[0];
  if (image) {
    payload.image = image;
  }

  if (params.mask) {
    payload.mask = params.mask;
  }

  return payload;
}
