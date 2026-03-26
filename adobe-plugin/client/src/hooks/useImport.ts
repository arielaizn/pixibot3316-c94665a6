import { useState } from 'react';
import { DownloadManager } from '../lib/downloadManager';
import { JSXBridge } from '../lib/jsx-bridge';

export function useImport() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const importProject = async (projectId: string, project: any) => {
    setImporting(true);
    setProgress(0);
    setError(null);

    try {
      const downloadManager = new DownloadManager();
      const app = JSXBridge.getHostApplication();

      if (project.storage_path) {
        // ─── Storage-based flow (organized by subfolders) ───
        setProgress(10);
        const { categorizedFiles, allFiles } = await downloadManager.downloadProjectFromStorage(
          projectId,
          project.storage_path
        );

        if (allFiles.length === 0) {
          throw new Error('No files to import - project storage may be empty');
        }

        setProgress(60);

        if (app === 'premiere') {
          const result = await JSXBridge.importToPremiereOrganized(categorizedFiles, project.name);
          console.log('Premiere organized import result:', result);
          if (!result.success) throw new Error(result.error || 'Import failed');
        } else if (app === 'aftereffects') {
          const result = await JSXBridge.importToAfterEffectsOrganized(categorizedFiles, project.name);
          console.log('After Effects organized import result:', result);
          if (!result.success) throw new Error(result.error || 'Import failed');
        } else {
          throw new Error('Unknown host application');
        }
      } else {
        // ─── Legacy flow (flat import from DB records) ───
        setProgress(20);
        const { files } = await downloadManager.downloadProject(
          projectId,
          project.files || [],
          project.videos || []
        );

        if (files.length === 0) {
          throw new Error('No files to import - project may be empty or downloads failed');
        }

        setProgress(60);

        if (app === 'premiere') {
          const result = await JSXBridge.importToPremiere(files, project.name);
          console.log('Premiere import result:', result);
          if (!result.success) throw new Error(result.error || 'Import failed');
        } else if (app === 'aftereffects') {
          const result = await JSXBridge.importToAfterEffects(files, project.name);
          console.log('After Effects import result:', result);
          if (!result.success) throw new Error(result.error || 'Import failed');
        } else {
          throw new Error('Unknown host application');
        }
      }

      setProgress(100);
      return { success: true };
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message || 'Import failed');
      return { success: false, error: err.message };
    } finally {
      setImporting(false);
    }
  };

  return { importProject, importing, progress, error };
}
