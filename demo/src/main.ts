import './style.css';
import { fetchDefaults, generate } from './api';

type ImageEntry =
  | { kind: 'default'; name: string; url: string }
  | { kind: 'uploaded'; name: string; file: File; previewUrl: string };

const SUPPORTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

const form = document.getElementById('generate-form') as HTMLFormElement;
const apiKeyField = document.getElementById('api-key') as HTMLInputElement;
const dropzone = document.getElementById('dropzone') as HTMLDivElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const thumbnailList = document.getElementById('thumbnail-list') as HTMLUListElement;
const promptField = document.getElementById('prompt') as HTMLTextAreaElement;
const subjectField = document.getElementById('subject') as HTMLInputElement;
const styleNotesField = document.getElementById('style-notes') as HTMLInputElement;
const generateButton = document.getElementById('generate-button') as HTMLButtonElement;
const resultStatus = document.getElementById('result-status') as HTMLDivElement;
const resultPanel = document.getElementById('result-panel') as HTMLDivElement;

let images: ImageEntry[] = [];

function renderThumbnails() {
  thumbnailList.innerHTML = '';
  images.forEach((entry, index) => {
    const li = document.createElement('li');
    li.className = 'relative';

    const img = document.createElement('img');
    img.src = entry.kind === 'default' ? entry.url : entry.previewUrl;
    img.alt = entry.name;
    img.loading = 'lazy';
    img.className = 'aspect-square w-full rounded-md border border-neutral-200 object-cover';
    li.appendChild(img);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.setAttribute('aria-label', `Remove ${entry.name}`);
    removeButton.className =
      'absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-xs text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600';
    removeButton.textContent = '×';
    removeButton.addEventListener('click', () => {
      const [removed] = images.splice(index, 1);
      if (removed?.kind === 'uploaded') URL.revokeObjectURL(removed.previewUrl);
      renderThumbnails();
    });
    li.appendChild(removeButton);

    thumbnailList.appendChild(li);
  });
}

function addFiles(fileList: FileList | File[]) {
  for (const file of Array.from(fileList)) {
    if (!SUPPORTED_IMAGE_TYPES.has(file.type)) continue;
    images.push({ kind: 'uploaded', name: file.name, file, previewUrl: URL.createObjectURL(file) });
  }
  renderThumbnails();
}

dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    fileInput.click();
  }
});
dropzone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropzone.classList.add('border-brand-600');
});
dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('border-brand-600');
});
dropzone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropzone.classList.remove('border-brand-600');
  if (event.dataTransfer?.files) addFiles(event.dataTransfer.files);
});
fileInput.addEventListener('change', () => {
  if (fileInput.files) addFiles(fileInput.files);
  fileInput.value = '';
});

/** Materializes every current image entry as a File, fetching still-unmodified defaults as blobs. */
async function resolveImageFiles(): Promise<File[]> {
  const files: File[] = [];
  for (const entry of images) {
    if (entry.kind === 'uploaded') {
      files.push(entry.file);
      continue;
    }
    const response = await fetch(entry.url);
    const blob = await response.blob();
    files.push(new File([blob], entry.name, { type: blob.type }));
  }
  return files;
}

function setBusy(busy: boolean) {
  generateButton.disabled = busy;
  generateButton.textContent = busy ? 'Generating…' : 'Generate icon';
}

function renderResult(status: string, node?: Node) {
  resultStatus.textContent = status;
  resultPanel.innerHTML = '';
  resultPanel.appendChild(node ?? emptyResultMessage());
}

function emptyResultMessage(): Node {
  const p = document.createElement('p');
  p.className = 'text-sm text-neutral-400';
  p.textContent = 'No icon generated yet.';
  return p;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const subject = subjectField.value.trim();
  setBusy(true);
  renderResult('Generating icon…');

  try {
    const files = await resolveImageFiles();
    const result = await generate({
      subject,
      styleNotes: styleNotesField.value.trim() || undefined,
      apiKey: apiKeyField.value.trim() || undefined,
      prompt: promptField.value,
      images: files,
    });

    if (result.success && result.imageData && result.mimeType) {
      const dataUrl = `data:${result.mimeType};base64,${result.imageData}`;
      const wrapper = document.createElement('div');
      wrapper.className = 'flex flex-col items-center gap-3';

      const img = document.createElement('img');
      img.src = dataUrl;
      img.alt = `Generated icon for ${subject}`;
      img.className = 'max-h-64 rounded-md';
      wrapper.appendChild(img);

      const extension = result.mimeType.split('/')[1] ?? 'png';
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${subject.replace(/\s+/g, '-').toLowerCase()}.${extension}`;
      link.className = 'text-sm font-medium text-brand-700 underline';
      link.textContent = 'Download';
      wrapper.appendChild(link);

      renderResult('Icon generated.', wrapper);
    } else {
      renderResult(result.error ?? 'Icon generation failed.');
    }
  } catch (error) {
    renderResult(error instanceof Error ? error.message : 'Icon generation failed.');
  } finally {
    setBusy(false);
  }
});

const donateCard = document.getElementById('donate-card');
document
  .getElementById('donate-dismiss')
  ?.addEventListener('click', () => donateCard?.remove());

(async function init() {
  try {
    const defaults = await fetchDefaults();
    promptField.value = defaults.prompt;
    images = defaults.images.map((image) => ({ kind: 'default', name: image.name, url: image.url }));
    renderThumbnails();
  } catch {
    renderResult('Could not load default assets — you can still upload your own images and prompt.');
  }
})();
