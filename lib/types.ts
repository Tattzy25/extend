export interface ReplicateInput {
  prompt: string;
  model: string;
  aspect_ratio: string;
  output_format: string;
  num_outputs: number;
  megapixels: string;
  output_quality: number;
  guidance_scale: number;
  num_inference_steps: number;
  go_fast: boolean;
  disable_safety_checker: boolean;
  prompt_strength: number;
  lora_scale: number;
  extra_lora_scale: number;
  image?: string;
  mask?: string;
}
