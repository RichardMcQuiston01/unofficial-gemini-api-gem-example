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
   * Optional model for this request. Overrides `GEMINI_TEXT_MODEL` and the
   * default text model.
   */
  model?: string;
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

/** An image passed inline to Gemini. */
export interface InlineImage {
  /** Base64-encoded image bytes. */
  data: string;
  /** MIME type, e.g. "image/png" or "image/jpeg". */
  mimeType: string;
}

/** Input to {@link editImage}. */
export interface ImageEditRequest {
  /** The image to edit. */
  image: InlineImage;
  /** What to change, e.g. "soft studio light on a plain white background". */
  prompt: string;
  /** Optional system instruction, e.g. rules the edit must keep to. */
  instructions?: string;
  /** Optional extra images to guide the edit (style or scene references). */
  referenceImages?: InlineImage[];
  /**
   * Optional model for this request. Overrides `GEMINI_IMAGE_MODEL` and the
   * default image model.
   */
  model?: string;
  /**
   * Optional Gemini API key for this request. Overrides the
   * `GEMINI_API_KEY` environment variable.
   */
  apiKey?: string;
}

/** Output of {@link editImage}. */
export interface ImageEditResult {
  /** Whether an edited image was returned. */
  success: boolean;
  /** Base64-encoded image data (no disk write). */
  imageData?: string;
  /** MIME type of {@link imageData}, e.g. "image/png". */
  mimeType?: string;
  /** Any text Gemini returned alongside the image, e.g. a short note. */
  text?: string;
  /** Present when {@link success} is false. */
  error?: string;
}
