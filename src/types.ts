/** Input to {@link generateIcon}. */
export interface IconGenerationRequest {
  /** Short label for the subject, e.g. "CO2 Laser Engraver" */
  subject: string;
  /** Optional additional style notes appended to the prompt */
  styleNotes?: string;
}

/** Output of {@link generateIcon}. */
export interface IconGenerationResult {
  /** Whether an image was successfully generated. */
  success: boolean;
  /** Base64-encoded image data (no disk write). */
  imageData?: string;
  /** MIME type of {@link imageData}, e.g. "image/png". */
  mimeType?: string;
  /** Present when {@link success} is false. */
  error?: string;
}
