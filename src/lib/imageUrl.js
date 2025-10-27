import { supabase } from './supabaseClient';

// Returns a public URL for a given path or URL.
// - If already an absolute URL, returns as-is.
// - If it's a storage path (e.g. "raffles/file.png"), it resolves using the
//   "images" bucket's public URL.
export function resolveImageUrl(pathOrUrl) {
  if (!pathOrUrl) return '';
  try {
    const trimmed = String(pathOrUrl).trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed; // already absolute

    // Normalize object path for the 'images' bucket
    let objectPath = trimmed
      .replace(/^\/+/, '') // remove leading '/'
      .replace(/^images\//, ''); // if someone stored 'images/...' strip bucket prefix

    // Treat as an object path inside the "images" bucket
    const { data } = supabase.storage.from('images').getPublicUrl(objectPath);
    return data?.publicUrl || '';
  } catch (_) {
    return '';
  }
}

// A tiny transparent PNG fallback to avoid broken image icon
export const TRANSPARENT_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
