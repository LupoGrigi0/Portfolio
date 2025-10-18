/**
 * ActionBarHandlers
 *
 * Handlers for the unified action bar buttons:
 * - Download Config
 * - Upload Config
 * - Undo/Redo (placeholders for Phase 2)
 *
 * @author Agent Team 1 (Core Features)
 * @created 2025-10-14
 */

/**
 * Downloads the current configuration as a JSON file
 */
export function handleDownloadConfig(
  configJson: string,
  slug: string,
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void
) {
  try {
    const configData = JSON.parse(configJson);
    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}-config.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast(`Config downloaded: ${slug}-config.json`, 'success');
  } catch (error) {
    console.error('Error downloading config:', error);
    showToast('Failed to download config', 'error');
  }
}

/**
 * Handles file upload and validates the JSON structure
 */
export function handleUploadConfig(
  event: React.ChangeEvent<HTMLInputElement>,
  setConfigJson: (json: string) => void,
  markDirty: (scope: 'page') => void,
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void
) {
  const file = event.target.files?.[0];
  if (!file) return;

  // Check file size (1MB limit)
  if (file.size > 1024 * 1024) {
    showToast('File too large. Maximum size is 1MB.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const config = JSON.parse(content);

      // Validate structure (basic check)
      if (typeof config !== 'object' || config === null) {
        throw new Error('Invalid config format');
      }

      // Apply to state
      setConfigJson(JSON.stringify(config, null, 2));
      markDirty('page');
      showToast('Config loaded successfully!', 'success');
    } catch (error) {
      console.error('Error parsing uploaded config:', error);
      showToast(
        error instanceof Error ? error.message : 'Invalid JSON file',
        'error'
      );
    }
  };

  reader.onerror = () => {
    showToast('Failed to read file', 'error');
  };

  reader.readAsText(file);
}

/**
 * Placeholder for undo functionality (Phase 2)
 */
export function handleUndo(showToast: (message: string, type: 'info') => void) {
  showToast('Undo functionality will be available in Phase 2', 'info');
}

/**
 * Placeholder for redo functionality (Phase 2)
 */
export function handleRedo(showToast: (message: string, type: 'info') => void) {
  showToast('Redo functionality will be available in Phase 2', 'info');
}
