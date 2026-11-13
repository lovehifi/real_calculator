import { ModelInputs } from '../types/model';
import { normalizeImportedInputs } from '../data/sampleProject';

const HASH_PREFIX = '#deal=';

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function compressDeflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream('deflate-raw');
  const writer = cs.writable.getWriter();
  await writer.write(new Uint8Array(bytes));
  await writer.close();
  const buf = await new Response(cs.readable).arrayBuffer();
  return new Uint8Array(buf);
}

async function decompressDeflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  await writer.write(new Uint8Array(bytes));
  await writer.close();
  const buf = await new Response(ds.readable).arrayBuffer();
  return new Uint8Array(buf);
}

/**
 * Encodes a ModelInputs payload into a compact URL hash (#deal=z.<b64> or #deal=j.<b64>).
 */
export async function encodeProjectToHash(inputs: ModelInputs): Promise<string> {
  const rawBytes = new TextEncoder().encode(JSON.stringify(inputs));
  if (typeof CompressionStream !== 'undefined') {
    try {
      const compressed = await compressDeflateRaw(rawBytes);
      return `${HASH_PREFIX}z.${toBase64Url(compressed)}`;
    } catch {
      // Fallback to raw base64url JSON
    }
  }
  return `${HASH_PREFIX}j.${toBase64Url(rawBytes)}`;
}

/**
 * Decodes a #deal=... hash back into normalized ModelInputs, or returns null if absent/invalid.
 */
export async function decodeProjectFromHash(hash: string): Promise<ModelInputs | null> {
  if (!hash || !hash.startsWith(HASH_PREFIX)) return null;
  const payload = hash.slice(HASH_PREFIX.length).trim();
  if (!payload) return null;

  try {
    let jsonText = '';
    if (payload.startsWith('z.') && typeof DecompressionStream !== 'undefined') {
      const compressed = fromBase64Url(payload.slice(2));
      const decompressed = await decompressDeflateRaw(compressed);
      jsonText = new TextDecoder().decode(decompressed);
    } else if (payload.startsWith('j.')) {
      const bytes = fromBase64Url(payload.slice(2));
      jsonText = new TextDecoder().decode(bytes);
    } else {
      const bytes = fromBase64Url(payload);
      jsonText = new TextDecoder().decode(bytes);
    }
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
    return normalizeImportedInputs(parsed);
  } catch {
    return null;
  }
}
