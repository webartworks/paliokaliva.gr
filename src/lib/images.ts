// Formats offered for every photo, best first; the browser takes the first it supports.
// AVIF gives the smallest files but is slow to make. The built site makes each file once,
// but `pnpm dev` makes them again on every request, so dev uses WebP only.
export const imageFormats: ('avif' | 'webp')[] = import.meta.env.DEV ? ['webp'] : ['avif', 'webp'];

// The `sizes` value for a photo that fills a full-width area of a given height
// (`heightVh`, in % of the screen height) and is cropped to cover it.
// On a tall phone screen such a photo is drawn much wider than the screen, because it
// is scaled up until it covers the height. Telling the browser only "100vw" makes it
// pick a file that is too small, and the photo looks blurred.
export function coverSizes(image: ImageMetadata, heightVh: number): string {
  const drawnWidth = Math.round((image.width / image.height) * heightVh);
  return `(max-aspect-ratio: ${drawnWidth}/100) ${drawnWidth}vh, 100vw`;
}
