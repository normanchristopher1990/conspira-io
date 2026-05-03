import { useRef, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { deleteEvidenceFile, uploadEvidenceFile, type UploadedFile } from '../../lib/storage';

type Props = {
  value: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
  disabled?: boolean;
};

export default function FileUpload({ value, onChange, disabled }: Props) {
  const { user, isConfigured } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickFile() {
    inputRef.current?.click();
  }

  async function handleSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    if (!user) {
      setError('Sign in to upload files.');
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadEvidenceFile(user.id, file);
      onChange(uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function clearFile() {
    if (value?.storage_path) {
      void deleteEvidenceFile(value.storage_path).catch(() => {});
    }
    onChange(null);
  }

  if (!isConfigured) {
    return (
      <div className="rounded-md border border-dashed border-line bg-slate-50 px-3 py-3 text-xs text-muted">
        File uploads require Supabase to be configured.
      </div>
    );
  }

  if (value) {
    return (
      <div className="rounded-md ring-1 ring-line bg-slate-50 px-3 py-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-ink">{value.filename}</p>
          <p className="text-[11px] font-mono-num text-muted">
            {formatBytes(value.size)} · {value.mime}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={value.public_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand hover:underline"
          >
            Preview
          </a>
          <button
            type="button"
            onClick={clearFile}
            className="text-xs text-score-bad hover:underline"
            disabled={disabled}
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={pickFile}
        disabled={disabled || uploading || !user}
        className="w-full rounded-md border border-dashed border-line bg-white px-3 py-3 text-sm font-medium text-brand hover:border-brand hover:bg-brand/5 disabled:opacity-50"
      >
        {uploading ? 'Uploading…' : !user ? 'Sign in to upload a file' : '↥ Upload a file'}
      </button>
      <p className="mt-1 text-[11px] text-muted">
        PDFs, images, video, audio, plain text — up to 20 MB.
      </p>
      {error && <p className="mt-1 text-xs text-score-bad">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="application/pdf,image/*,video/*,audio/*,text/plain,text/markdown,text/html"
        onChange={handleSelected}
      />
    </div>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
