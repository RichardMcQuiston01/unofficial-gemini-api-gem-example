/** Input to {@link generateIcon}. */
export interface IconGenerationRequest {
  /** Short label for the subject, e.g. "CO2 Laser Engraver" */
  subject: string;
  /** Optional additional style notes appended to the prompt */
  styleNotes?: string;
  /**
   * Optional Gemini API key for this request. Overrides the
   * `GEMINI_API_KEY` environment variable; useful when a single process
   * serves multiple keys.
   */
  apiKey?: string;
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

/** Input to {@link generateText}. */
export interface TextGenerationRequest {
  /** The text to transform, e.g. a product description. */
  input: string;
  /**
   * Optional base prompt (system instruction) for this request. Overrides
   * `text-instructions.txt` in the assets directory.
   */
  instructions?: string;
  /**
   * Optional Gemini API key for this request. Overrides the
   * `GEMINI_API_KEY` environment variable.
   */
  apiKey?: string;
}

/** Output of {@link generateText}. */
export interface TextGenerationResult {
  /** Whether text was successfully generated. */
  success: boolean;
  /** The transformed text. */
  text?: string;
  /** Present when {@link success} is false. */
  error?: string;
}
