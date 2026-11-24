export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function normalizeFotoPaths(item: {
  path_foto?: string | null;
  foto_paths?: string[] | null;
}): string[] {
  if (Array.isArray(item.foto_paths) && item.foto_paths.length > 0) {
    return item.foto_paths.filter((p): p is string => Boolean(p && p.trim()));
  }
  if (item.path_foto) {
    return [item.path_foto];
  }
  return [];
}
