import React, { useEffect, useMemo, useState } from 'react';
import ImageWithFallback from '../common/ImageWithFallback';
import { supabase } from '../../lib/supabaseClient';
import {
  Upload,
  Trash2,
  Copy,
  RefreshCw,
  Image as ImageIcon,
  Check,
  PackagePlus,
} from 'lucide-react';
import imagesManifest from '../../images/manifest';
import { useToast } from '../../contexts/ToastContext';

const BUCKET = 'images';

const ImageManager = () => {
  const { show } = useToast();
  const [files, setFiles] = useState([]);
  const [pathPrefix, setPathPrefix] = useState('uploads/');
  const [bulkPrefix, setBulkPrefix] = useState('library/');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState('');

  const bucketClient = useMemo(() => supabase.storage.from(BUCKET), []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await bucketClient.list(pathPrefix, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });
      if (error) throw error;
      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('List files error:', err);
      show(`Failed to list files: ${err.message || err}`, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAsBlob = async url => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    return await res.blob();
  };

  const handleBulkImport = async () => {
    try {
      if (!Array.isArray(imagesManifest) || imagesManifest.length === 0) {
        show('No images found in manifest.', { type: 'warning' });
        return;
      }
      setUploading(true);
      for (const item of imagesManifest) {
        const blob = await fetchAsBlob(item.url);
        const ext = (item.name.split('.').pop() || 'png').toLowerCase();
        const key = `${bulkPrefix.replace(/\/$/, '')}/${item.name}`;
        const { error } = await bucketClient.upload(key, blob, {
          upsert: true,
          cacheControl: '3600',
          contentType: blob.type || `image/${ext}`,
        });
        if (error) throw error;
      }
      await fetchFiles();
      show('Bulk import completed.', { type: 'success' });
    } catch (err) {
      console.error('Bulk import error:', err);
      show(`Bulk import failed: ${err.message || err}`, { type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathPrefix]);

  const handleUpload = async e => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      const ext = file.name.split('.').pop();
      const key = `${pathPrefix.replace(/\/$/, '')}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await bucketClient.upload(key, file, {
        upsert: false,
        cacheControl: '3600',
        contentType: file.type || 'application/octet-stream',
      });
      if (error) throw error;
      await fetchFiles();
      // Clear input value to allow same-file re-upload flow
      e.target.value = '';
    } catch (err) {
      console.error('Upload error:', err);
      show(`Upload failed: ${err.message || err}`, { type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async name => {
    try {
      if (!window.confirm('Delete this file?')) return;
      const fullPath = `${pathPrefix}${name}`;
      const { error } = await bucketClient.remove([fullPath]);
      if (error) throw error;
      await fetchFiles();
    } catch (err) {
      console.error('Delete error:', err);
      show(`Delete failed: ${err.message || err}`, { type: 'error' });
    }
  };

  const getPublicUrl = name => {
    const fullPath = `${pathPrefix}${name}`;
    const { data } = bucketClient.getPublicUrl(fullPath);
    return data?.publicUrl || '';
  };

  const handleCopy = async name => {
    const url = getPublicUrl(name);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(name);
      setTimeout(() => setCopiedKey(''), 1500);
    } catch (err) {
      console.error('Clipboard error:', err);
      show('Failed to copy to clipboard', { type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Media Library</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload images to the Supabase Storage bucket "{BUCKET}"
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={pathPrefix}
            onChange={e =>
              setPathPrefix(e.target.value.endsWith('/') ? e.target.value : `${e.target.value}/`)
            }
            className="input-field w-full sm:w-48"
            placeholder="uploads/"
            aria-label="Path prefix"
          />
          <button onClick={fetchFiles} className="btn-secondary" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <label
            className={`btn-primary cursor-pointer ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <Upload className="w-4 h-4 mr-2 inline" />
            {uploading ? 'Uploading...' : 'Upload'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={bulkPrefix}
            onChange={e =>
              setBulkPrefix(e.target.value.endsWith('/') ? e.target.value : `${e.target.value}/`)
            }
            className="input-field w-full sm:w-40"
            placeholder="library/"
            aria-label="Bulk import prefix"
          />
          <button
            onClick={handleBulkImport}
            className={`btn-secondary ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={uploading}
          >
            <PackagePlus className="w-4 h-4 mr-2" />
            {uploading ? 'Importing...' : 'Bulk import from src/images'}
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        ) : files.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            No files found in "{pathPrefix}"
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map(f => (
              <div
                key={f.name}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-gray-500" />
                    <span
                      className="text-sm text-gray-800 dark:text-gray-200 truncate max-w-[180px]"
                      title={f.name}
                    >
                      {f.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {(f.metadata?.size || 0) / 1024 < 1024
                      ? `${Math.round((f.metadata?.size || 0) / 1024)} KB`
                      : `${(f.metadata?.size / 1024 / 1024).toFixed(1)} MB`}
                  </span>
                </div>
                <div className="aspect-video bg-gray-100 dark:bg-gray-900 rounded flex items-center justify-center overflow-hidden">
                  <ImageWithFallback
                    src={getPublicUrl(f.name)}
                    alt={f.name}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="mt-3 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => handleCopy(f.name)}
                    className="btn-secondary px-2 py-1 text-xs"
                  >
                    {copiedKey === f.name ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(f.name)}
                    className="btn-danger px-2 py-1 text-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400">
        Tip: Ensure your Supabase Storage bucket "{BUCKET}" has public read enabled if you want to
        use public URLs in the app. You can also serve via signed URLs for private images.
      </div>
    </div>
  );
};

export default ImageManager;
