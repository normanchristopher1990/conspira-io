import { supabase } from './supabase';

const BUCKET = 'evidence';

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'text/plain',
  'text/markdown',
  'text/html',
]);

const MAX_BYTES = 20 * 1024 * 1024;

export type UploadedFile = {
  storage_path: string;
  public_url: string;
  filename: string;
  size: number;
  mime: string;
};

export async function uploadEvidenceFile(
  userId: string,
  file: File,
): Promise<UploadedFile> {
  if (!supabase) throw new Error('Supabase not configured');
  if (file.size > MAX_BYTES) {
    throw new Error('File is larger than the 20 MB limit.');
  }
  if (file.type && !ALLOWED_MIME.has(file.type)) {
    throw new Error(`File type ${file.type} is not allowed.`);
  }

  const ext = (file.name.split('.').pop() ?? 'bin').toLowerCase().slice(0, 8);
  const id = crypto.randomUUID();
  const path = `${userId}/${id}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return {
    storage_path: path,
    public_url: data.publicUrl,
    filename: file.name,
    size: file.size,
    mime: file.type || 'application/octet-stream',
  };
}

export function publicUrlForStoragePath(path: string | null | undefined): string | null {
  if (!path || !supabase) return null;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteEvidenceFile(path: string): Promise<void> {
  if (!supabase) return;
  await supabase.storage.from(BUCKET).remove([path]);
}
