import JSZip from 'jszip';

/**
 * Packages multiple files into a single in-memory ZIP archive File object.
 */
export async function bundleFilesToZip(
  files: File[],
  zipName?: string,
  onProgress?: (percent: number) => void
): Promise<File> {
  if (files.length === 1 && !zipName) {
    return files[0];
  }

  const zip = new JSZip();

  for (const file of files) {
    // Preserve webkitRelativePath if folder drop was used, otherwise fallback to name
    const filePath = file.webkitRelativePath || file.name;
    const buffer = await file.arrayBuffer();
    zip.file(filePath, buffer);
  }

  const generatedBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(Math.round(metadata.percent));
      }
    }
  );

  const finalName =
    zipName ||
    `deploshare_bundle_${new Date().toISOString().slice(0, 10)}_${files.length}_files.zip`;

  return new File([generatedBlob], finalName, {
    type: 'application/zip',
  });
}
