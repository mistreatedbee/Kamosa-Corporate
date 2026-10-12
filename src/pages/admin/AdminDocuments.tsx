import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { DownloadIcon, FileTextIcon, Loader2Icon, Trash2Icon, UploadIcon } from 'lucide-react';
import { Seo } from '../../components/Seo';

interface Document {
  path: string;
  sizeBytes: number | null;
  createdAt: string;
  url: string | null;
}

const MAX_BYTES = 3 * 1024 * 1024;

function formatBytes(bytes: number | null) {
  if (bytes === null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function AdminDocuments() {
  const [documents, setDocuments] = useState<Document[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setError(null);
    const response = await fetch('/api/admin/tools?resource=documents', { credentials: 'include' });
    if (response.status === 401) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (!response.ok) {
      setError('Could not load documents.');
      return;
    }
    const data = await response.json();
    setDocuments(data.documents);
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_BYTES) {
      setError('File must be 3MB or smaller.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setError(null);
    setUploading(true);
    const base64Data = await fileToBase64(file);
    const response = await fetch('/api/admin/tools?resource=documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ fileName: file.name, mimeType: file.type, base64Data })
    });
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (response.status === 401) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (!response.ok) {
      setError('Upload failed. Please try again.');
      return;
    }
    load();
  };

  const handleDelete = async (path: string) => {
    if (!window.confirm('Delete this document?')) return;
    const response = await fetch(`/api/admin/tools?resource=documents&path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (response.status === 401) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (response.ok) load();
  };

  return (
    <div>
      <Seo title="Documents | Kamosa Admin" description="Kamosa admin document library." noindex />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-ink-900">Documents</h1>
          <p className="mt-1.5 text-[0.9375rem] text-muted">A private file library for internal documents. PDF, Word, images — up to 3MB.</p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-md bg-ink-900 px-3.5 py-2 text-[0.8125rem] font-semibold text-white transition-colors duration-200 hover:bg-ink-700">
          {uploading ? <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden={true} /> : <UploadIcon className="h-4 w-4" aria-hidden={true} />}
          {uploading ? 'Uploading…' : 'Upload document'}
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {error ? <p className="mt-4 text-[0.8125rem] text-error-600">{error}</p> : null}

      <div className="mt-6 overflow-hidden rounded-lg border border-hairline bg-white shadow-card">
        {documents === null ? (
          <div className="flex items-center gap-2 p-8 text-[0.9375rem] text-muted">
            <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden={true} />
            Loading…
          </div>
        ) : null}

        {documents && documents.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-8 py-16 text-center">
            <FileTextIcon className="h-8 w-8 text-hairline" aria-hidden={true} />
            <p className="text-[0.9375rem] font-semibold text-ink-900">No documents yet.</p>
            <p className="max-w-sm text-[0.8125rem] text-muted">Upload a file to get started.</p>
          </div>
        ) : null}

        {documents && documents.length > 0 ? (
          <ul className="divide-y divide-hairline">
            {documents.map((doc) => (
              <li key={doc.path} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <FileTextIcon className="h-4 w-4 shrink-0 text-muted" aria-hidden={true} />
                  <div className="min-w-0">
                    <p className="truncate text-[0.875rem] font-medium text-ink-900">{doc.path}</p>
                    <p className="text-[0.75rem] text-muted">
                      {formatBytes(doc.sizeBytes)} · {new Date(doc.createdAt).toLocaleDateString('en-ZA')}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-md border border-hairline px-2.5 py-1.5 text-[0.75rem] font-medium text-ink-900 transition-colors duration-200 hover:bg-cream">
                      <DownloadIcon className="h-3.5 w-3.5" aria-hidden={true} />
                      Download
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.path)}
                    aria-label={`Delete ${doc.path}`}
                    className="rounded-md border border-hairline p-1.5 text-error-600 transition-colors duration-200 hover:bg-error-50">
                    <Trash2Icon className="h-3.5 w-3.5" aria-hidden={true} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
