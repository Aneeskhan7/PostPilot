// frontend/src/components/MediaUploader.tsx
import { FC, useRef, useState, useCallback } from 'react';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { uploadMedia, deleteMedia } from '../lib/api/media';
import { useAuth } from '../hooks/useAuth';

interface MediaUploaderProps {
  urls: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

const MediaUploader: FC<MediaUploaderProps> = ({ urls, onChange, maxFiles = 4 }) => {
  const { getAccessToken } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const upload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const token = getAccessToken();
    if (!token) return;

    const remaining = maxFiles - urls.length;
    const toUpload = Array.from(files).slice(0, remaining);

    if (toUpload.length === 0) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setError('');
    setUploading(true);

    try {
      const uploaded = await Promise.all(toUpload.map((f) => uploadMedia(token, f)));
      onChange([...urls, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [getAccessToken, urls, onChange, maxFiles]);

  const remove = async (url: string) => {
    const token = getAccessToken();
    if (!token) return;
    onChange(urls.filter((u) => u !== url));
    try {
      await deleteMedia(token, url);
    } catch {
      // Non-fatal — URL already removed from state
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    upload(e.dataTransfer.files);
  }, [upload]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const canUpload = urls.length < maxFiles && !uploading;

  return (
    <div className="space-y-3">
      {/* Thumbnails */}
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url) => (
            <div key={url} className="relative group w-20 h-20 flex-shrink-0">
              <img
                src={url}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover rounded-xl bg-zinc-800"
              />
              <button
                type="button"
                onClick={() => remove(url)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {canUpload && (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
            dragging
              ? 'border-violet-500 bg-violet-500/10'
              : 'border-white/10 hover:border-white/20 hover:bg-white/5'
          }`}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              {dragging ? (
                <ImageIcon className="w-5 h-5 text-violet-400" />
              ) : (
                <Upload className="w-5 h-5 text-zinc-400" />
              )}
            </div>
          )}
          <div className="text-center">
            <p className="text-sm text-zinc-300 font-medium">
              {uploading ? 'Uploading…' : 'Drop files or click to upload'}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              JPG, PNG, GIF, WebP, MP4 · max 50MB · {maxFiles - urls.length} remaining
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4"
            className="sr-only"
            onChange={(e) => upload(e.target.files)}
            aria-label="Upload media files"
          />
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default MediaUploader;
