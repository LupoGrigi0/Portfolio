# Quick Integration Guide - Copy & Paste

This file contains the exact code snippets to copy and paste into Lightboard.tsx for fast integration.

## 1. Add to Imports (Line ~11)

```typescript
import { useToast } from './ToastContext';
import { UnifiedActionBar } from './UnifiedActionBar';
import { handleDownloadConfig, handleUploadConfig, handleUndo, handleRedo } from './ActionBarHandlers';
```

## 2. Add after `export default function Lightboard` (Line ~31)

```typescript
const { showToast } = useToast();
```

## 3. Replace Alert in `handleSaveSiteSettings` (Line ~307)

```typescript
// Replace this:
alert('Site settings saved successfully!');
// With this:
showToast('Site settings saved successfully!', 'success');

// Replace this:
alert(`Error saving settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
// With this:
showToast(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
```

## 4. Replace Alert in `handleLoadCurrentSettings` (Line ~339)

```typescript
// Replace this:
alert(`Error loading settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
// With this:
showToast(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
```

## 5. Replace Alert in `handleApplyPreview` (Line ~349)

```typescript
// Replace this:
alert('Preview applied! Configuration is valid.\n\nNote: Live preview updates will be implemented in the next phase.');
// With this:
showToast('Preview applied! Configuration is valid.', 'success');

// Replace this:
alert(`Invalid JSON: ${error instanceof Error ? error.message : 'Parse error'}`);
// With this:
showToast(`Invalid JSON: ${error instanceof Error ? error.message : 'Parse error'}`, 'error');
```

## 6. Replace Alert in `handleSaveToGallery` (Line ~391)

```typescript
// Replace this:
alert(`Configuration saved successfully!\n\nCollection: ${slug}`);
// With this:
showToast(`Configuration saved for ${slug}!`, 'success');

// Replace this:
alert(`Error saving configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
// With this:
showToast(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
```

## 7. Replace Alert in `handleSaveNavSettings` (Line ~511)

```typescript
// Replace this:
alert('Navigation settings saved successfully!');
// With this:
showToast('Navigation settings saved successfully!', 'success');

// Replace this:
alert('Failed to save navigation settings');
// With this:
showToast('Failed to save navigation settings', 'error');
```

## 8. Add Handler Wrappers after `handleResetNavSettings` (Line ~533)

```typescript
// Download/Upload Config Handlers
const handleDownloadConfigWrapper = () => {
  const slug = collection?.slug || currentCollectionName || 'config';
  handleDownloadConfig(configJson, slug, showToast);
};

const handleUploadConfigWrapper = (event: React.ChangeEvent<HTMLInputElement>) => {
  handleUploadConfig(event, setConfigJsonDirty, markDirty, showToast);
};

// Undo/Redo Handlers (Phase 2 placeholders)
const handleUndoWrapper = () => {
  handleUndo(showToast);
};

const handleRedoWrapper = () => {
  handleRedo(showToast);
};
```

## 9. Add Action Bar before closing `</>` (Line ~828)

```typescript
{/* Unified Action Bar */}
{isOpen && (
  <UnifiedActionBar
    onSaveSiteConfig={handleSaveSiteSettings}
    onSavePageConfig={handleSaveToGallery}
    onDownloadConfig={handleDownloadConfigWrapper}
    onUploadConfig={handleUploadConfigWrapper}
    onUndo={handleUndoWrapper}
    onRedo={handleRedoWrapper}
    isSavingSite={isSavingSite}
    isSavingPage={isSavingPage}
    isDirtySite={isDirty('site')}
    isDirtyPage={isDirty('page')}
    canUndo={false}
    canRedo={false}
    hasCollection={!!collection}
  />
)}
```

---

## That's it!

9 simple copy-paste operations to integrate Phase 1 features.

**Don't forget:** Use `LightboardWithToast` instead of `Lightboard` when rendering the component to enable the toast system!

```typescript
// In your page component:
import { LightboardWithToast } from '@/components/Lightboard';

// Instead of:
<Lightboard collection={collection} />

// Use:
<LightboardWithToast collection={collection} />
```
