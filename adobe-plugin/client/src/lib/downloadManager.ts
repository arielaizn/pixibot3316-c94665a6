/**
 * Download Manager - Handles file downloads from Pixibot to local disk
 * Uses CEP file system API (synchronous) for Adobe plugin environment
 */

export interface DownloadFile {
  id: string;
  name: string;
  url: string;
  localPath: string;
  size: number;
  type: string;
}

/** Max concurrent downloads */
const CONCURRENCY = 6;

export class DownloadManager {
  private tempDir: string = '';

  /**
   * Download an entire project to local disk (legacy flow)
   */
  async downloadProject(projectId: string, files: any[], videos: any[]): Promise<{
    projectPath: string;
    files: DownloadFile[];
  }> {
    this.tempDir = this.createTempDir(projectId);

    const fileIds = files.map(f => f.id);
    const videoIds = videos.map(v => v.id);
    const session = JSON.parse(localStorage.getItem('pixibot_session') || '{}');

    const response = await fetch(
      'https://ymhcczxxrgcnyxaqmohj.supabase.co/functions/v1/pixi-plugin-download',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_ids: fileIds, video_ids: videoIds }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get download URLs');
    }

    const { files: downloadUrls } = await response.json();

    const tasks = (downloadUrls as any[]).map((f: any) => ({
      url: f.url,
      localPath: `${this.tempDir}/${this.sanitizeFileName(f.name)}`,
    }));

    await this.downloadParallel(tasks);

    return {
      projectPath: this.tempDir,
      files: downloadUrls.map((f: any) => ({
        ...f,
        localPath: `${this.tempDir}/${this.sanitizeFileName(f.name)}`,
      })),
    };
  }

  /**
   * Download an entire project from storage path (organized by subfolders)
   */
  async downloadProjectFromStorage(projectId: string, storagePath: string): Promise<{
    projectPath: string;
    categorizedFiles: Record<string, DownloadFile[]>;
    allFiles: DownloadFile[];
  }> {
    this.tempDir = this.createTempDir(projectId);

    const session = JSON.parse(localStorage.getItem('pixibot_session') || '{}');

    const response = await fetch(
      'https://ymhcczxxrgcnyxaqmohj.supabase.co/functions/v1/pixi-plugin-download',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storage_path: storagePath }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get download URLs from storage');
    }

    const { categorizedFiles } = await response.json();

    if (!categorizedFiles || Object.keys(categorizedFiles).length === 0) {
      throw new Error('No files found in project storage');
    }

    // Build flat task list for parallel download, tracking folder membership
    const result: Record<string, DownloadFile[]> = {};
    const allFiles: DownloadFile[] = [];
    const downloadTasks: { url: string; localPath: string; folder: string; file: any }[] = [];

    for (const [folder, files] of Object.entries(categorizedFiles)) {
      const folderPath = `${this.tempDir}/${folder}`;
      this.ensureDirectory(folderPath);
      result[folder] = [];

      for (const file of files as any[]) {
        const sanitizedName = this.sanitizeFileName(file.name);
        const localPath = `${folderPath}/${sanitizedName}`;
        downloadTasks.push({ url: file.url, localPath, folder, file });
      }
    }

    // Download all files in parallel (6 at a time)
    await this.downloadParallel(downloadTasks);

    // Build result from completed tasks
    for (const task of downloadTasks) {
      const dlFile: DownloadFile = {
        id: `${task.folder}-${task.file.name}`,
        name: task.file.name,
        url: task.url,
        localPath: task.localPath,
        size: task.file.size || 0,
        type: task.file.mimeType || 'application/octet-stream',
      };
      result[task.folder].push(dlFile);
      allFiles.push(dlFile);
    }

    return { projectPath: this.tempDir, categorizedFiles: result, allFiles };
  }

  /**
   * Download multiple files in parallel with concurrency limit
   */
  private async downloadParallel(tasks: { url: string; localPath: string }[]): Promise<void> {
    const queue = [...tasks];
    const workers = Array.from(
      { length: Math.min(CONCURRENCY, queue.length) },
      async () => {
        while (queue.length > 0) {
          const task = queue.shift()!;
          await this.downloadFile(task.url, task.localPath);
        }
      }
    );
    await Promise.all(workers);
  }

  private createTempDir(projectId: string): string {
    const tempBase = this.getTempDirectory();
    const projectDir = `${tempBase}/pixibot-${projectId}-${Date.now()}`;

    if (typeof window.cep !== 'undefined' && window.cep.fs) {
      const result = window.cep.fs.makedir(projectDir);
      if (result.err !== 0) {
        console.warn('makedir returned error code:', result.err, '- continuing anyway');
      }
    }

    return projectDir;
  }

  private getTempDirectory(): string {
    const platform = navigator.platform.toLowerCase();
    if (platform.includes('win')) {
      if (typeof window.__adobe_cep__ !== 'undefined') {
        try {
          const userData = window.__adobe_cep__.getSystemPath('userData');
          if (userData && !userData.includes('Invalid')) return userData;
        } catch (err) {
          console.warn('Failed to get userData path:', err);
        }
      }
      return 'C:\\Users\\Public\\Documents';
    }
    return '/tmp';
  }

  /**
   * Download a single file to disk
   */
  private async downloadFile(url: string, localPath: string): Promise<void> {
    if (typeof window.cep === 'undefined' || !window.cep.fs) {
      console.log(`Would download: ${url} -> ${localPath}`);
      return;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64String = this.arrayBufferToBase64(uint8Array);

    const result = window.cep.fs.writeFile(localPath, base64String, window.cep.encoding.Base64);
    if (result.err !== 0) {
      throw new Error(`Failed to write file (error code: ${result.err}): ${localPath}`);
    }
  }

  /**
   * Fast ArrayBuffer to base64 conversion using chunked String.fromCharCode
   * (avoids O(n²) string concatenation of the naive byte-by-byte approach)
   */
  private arrayBufferToBase64(bytes: Uint8Array): string {
    const CHUNK = 0x8000; // 32KB chunks - safe for Function.apply
    const parts: string[] = [];
    for (let i = 0; i < bytes.length; i += CHUNK) {
      const slice = bytes.subarray(i, Math.min(i + CHUNK, bytes.length));
      parts.push(String.fromCharCode.apply(null, slice as unknown as number[]));
    }
    return btoa(parts.join(''));
  }

  private ensureDirectory(dirPath: string): void {
    if (typeof window.cep !== 'undefined' && window.cep.fs) {
      const result = window.cep.fs.makedir(dirPath);
      if (result.err !== 0) {
        console.warn('makedir returned error code:', result.err, 'for path:', dirPath);
      }
    }
  }

  private sanitizeFileName(filename: string): string {
    return filename.replace(/[^\w\u0590-\u05FF._-]/g, '_');
  }
}
