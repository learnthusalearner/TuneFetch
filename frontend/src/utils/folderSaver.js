import JSZip from 'jszip';

/**
 * Checks if the browser supports the File System Access API (showDirectoryPicker)
 * Supported in modern Chromium browsers: Microsoft Edge, Google Chrome, Opera, etc.
 */
export const isDirectoryPickerSupported = () => {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
};

/**
 * Prompts user to pick a local folder, extracts all files from the ZIP blob,
 * and writes them directly into a subfolder named `folderName` (e.g. Thanks_for_downloading).
 *
 * @param {Blob} blob - The ZIP file blob from the server
 * @param {string} folderName - The folder name to create (default: 'Thanks_for_downloading')
 * @param {Function} onProgress - Callback for progress: ({ current, total, filename })
 * @returns {Promise<{ folderName: string, fileCount: number }>}
 */
export async function saveZipAsFolder(blob, folderName = 'Thanks_for_downloading', onProgress = null) {
  if (!isDirectoryPickerSupported()) {
    throw new Error('Direct folder saving is not supported in this browser. Please use the ZIP download option.');
  }

  // 1. Prompt user to choose where to save the folder
  const baseDirHandle = await window.showDirectoryPicker({
    id: 'tunefetch_music_folder',
    mode: 'readwrite',
    startIn: 'music'
  });

  // 2. Create the destination folder inside the picked directory
  const targetFolderHandle = await baseDirHandle.getDirectoryHandle(folderName, { create: true });

  // 3. Load zip archive in-memory
  const zip = await JSZip.loadAsync(blob);
  const fileNames = Object.keys(zip.files).filter((name) => !zip.files[name].dir);

  let written = 0;
  for (const relativePath of fileNames) {
    const file = zip.files[relativePath];
    // Strip parent folder prefix if the zip already wrapped files in Thanks_for_downloading/
    const baseName = relativePath.split('/').filter(Boolean).pop();
    if (!baseName) continue;

    const fileBuffer = await file.async('arraybuffer');
    const fileHandle = await targetFolderHandle.getFileHandle(baseName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(fileBuffer);
    await writable.close();

    written++;
    if (onProgress) {
      onProgress({
        current: written,
        total: fileNames.length,
        filename: baseName
      });
    }
  }

  return { folderName, fileCount: written };
}
