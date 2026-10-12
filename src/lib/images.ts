// Formats offered for every photo, best first; the browser takes the first it supports.
// AVIF gives the smallest files but is slow to make. The built site makes each file once,
// but `pnpm dev` makes them again on every request, so dev uses WebP only.
export const imageFormats: ('avif' | 'webp')[] = import.meta.env.DEV ? ['webp'] : ['avif', 'webp'];
