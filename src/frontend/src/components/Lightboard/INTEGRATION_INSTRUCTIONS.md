# Lightboard Phase 1 Integration Instructions

This document provides step-by-step instructions for integrating the Toast system, Unified Action Bar, and Download/Upload functionality into Lightboard.tsx.

## Files Created

1. `ToastContext.tsx` - Global toast state management
2. `Toast.tsx` - Toast notification component
3. `LightboardWithToast.tsx` - Wrapper component that provides toast context
4. `UnifiedActionBar.tsx` - Bottom action bar component
5. `ActionBarHandlers.ts` - Download/Upload handler functions

## Integration Steps

### Step 1: Add Imports to Lightboard.tsx

Add these imports after the existing imports (around line 11):

```typescript
import { useToast } from './ToastContext';
import { UnifiedActionBar } from './UnifiedActionBar';
import { handleDownloadConfig, handleUploadConfig, handleUndo, handleRedo } from './ActionBarHandlers';
```

### Step 2: Add Toast Hook

Inside the `Lightboard` function component, right after `export default function Lightboard({ collection }: LightboardProps) {`, add:

```typescript
const { showToast } = useToast();
```

### Step 3: Replace Alert Calls with Toast

Replace all `alert()` calls with `showToast()`:

**In `handleSaveSiteSettings` (around line 307):**
```typescript
// OLD:
alert('Site settings saved successfully!');
// NEW:
showToast('Site settings saved successfully!', 'success');

// OLD:
alert(`Error saving settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
// NEW:
showToast(`Error saving settings: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
```

**In `handleLoadCurrentSettings` (around line 339):**
```typescript
// OLD:
alert(`Error loading settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
// NEW:
showToast(`Error loading settings: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
```

**In `handleApplyPreview` (around line 349):**
```typescript
// OLD:
alert('Preview applied! Configuration is valid.\n\nNote: Live preview updates will be implemented in the next phase.');
// NEW:
showToast('Preview applied! Configuration is valid.', 'success');

// OLD:
alert(`Invalid JSON: ${error instanceof Error ? error.message : 'Parse error'}`);
// NEW:
showToast(`Invalid JSON: ${error instanceof Error ? error.message : 'Parse error'}`, 'error');
```

**In `handleSaveToGallery` (around line 391):**
```typescript
// OLD:
alert(`Configuration saved successfully!\n\nCollection: ${slug}`);
// NEW:
showToast(`Configuration saved successfully for ${slug}!`, 'success');

// OLD:
alert(`Error saving configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
// NEW:
showToast(`Error saving configuration: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
```

**In `handleSaveNavSettings` (around line 511):**
```typescript
// OLD:
alert('Navigation settings saved successfully!');
// NEW:
showToast('Navigation settings saved successfully!', 'success');

// OLD:
alert('Failed to save navigation settings');
// NEW:
showToast('Failed to save navigation settings', 'error');
```

### Step 4: Add Download/Upload Handler Wrappers

Add these handler functions inside the Lightboard component, after `handleResetNavSettings`:

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

### Step 5: Add Unified Action Bar to the JSX

Add the `UnifiedActionBar` component right before the closing `</>` tag at the end of the return statement (around line 829):

```typescript
return (
  <>
    {/* Toggle Button */}
    <button
      onClick={() => setIsOpen(!isOpen)}
      // ... existing toggle button code
    />

    {/* Floating Panel */}
    {isOpen && (
      <div>
        {/* ... existing panel code */}
      </div>
    )}

    {/* ADD THIS: Unified Action Bar */}
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
        canUndo={false} // Phase 2
        canRedo={false} // Phase 2
        hasCollection={!!collection}
      />
    )}

    <style jsx>{`
      // ... existing styles
    `}</style>
  </>
);
```

## Step 6: Update Widget Props (Optional for Phase 1)

The widgets still have their save buttons. You can optionally remove them by updating the widget interface to not require the save callbacks, or just leave them for now and remove in a future phase.

## Testing

1. Open Lightboard
2. Make changes to any settings
3. Verify toast notifications appear instead of browser alerts
4. Click "Download Config" - should download a JSON file
5. Click "Upload Config" - should open file dialog and load config
6. Verify dirty state badges (red dots) appear on tabs with unsaved changes
7. Verify "Save Site Config" and "Save Page Config" buttons are disabled when no changes
8. Verify "Undo" and "Redo" show info toasts about Phase 2

## Files Modified

- `Lightboard.tsx` - Main component integration
- `index.ts` - Export new components

## Next Steps (Phase 2)

- Implement actual Undo/Redo system with state snapshots
- Remove save buttons from individual widgets
- Add unsaved changes warning on close
