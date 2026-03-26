/**
 * JSX Bridge - Communication between React and ExtendScript
 * Provides methods to call ExtendScript functions from React
 */

declare global {
  interface Window {
    __adobe_cep__: any;
    cep: any;
  }
}

export class JSXBridge {
  /**
   * Evaluate ExtendScript code in the host application
   */
  static async evalScript(script: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (typeof window.__adobe_cep__ === 'undefined') {
        reject(new Error('CEP not available - not running in Adobe host'));
        return;
      }

      try {
        window.__adobe_cep__.evalScript(script, (result: string) => {
          try {
            // Try to parse JSON result
            const parsed = JSON.parse(result);
            resolve(parsed);
          } catch (err) {
            // Return raw string if not JSON
            resolve(result);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Call a JSX function with arguments
   */
  static async callJSXFunction(functionName: string, ...args: any[]): Promise<any> {
    const argsJson = JSON.stringify(args);
    const argsStr = argsJson.slice(1, -1); // Remove [ ]
    const script = `${functionName}(${argsStr})`;
    return this.evalScript(script);
  }

  /**
   * Import files to Premiere Pro
   */
  static async importToPremiere(files: any[], binName: string) {
    const filesJson = JSON.stringify(files);
    const script = `importFilesToPremiere('${filesJson.replace(/'/g, "\\'")}', "${binName}")`;
    return this.evalScript(script);
  }

  /**
   * Import files to After Effects
   */
  static async importToAfterEffects(files: any[], folderName: string) {
    const filesJson = JSON.stringify(files);
    const script = `importFilesToAfterEffects('${filesJson.replace(/'/g, "\\'")}', "${folderName}")`;
    return this.evalScript(script);
  }

  /**
   * Import files to Premiere Pro with bin organization
   */
  static async importToPremiereOrganized(categorizedFiles: Record<string, any[]>, projectName: string) {
    const payload = JSON.stringify({ categorizedFiles, projectName });
    const script = `importFilesToPremiereOrganized('${payload.replace(/'/g, "\\'")}')`;
    return this.evalScript(script);
  }

  /**
   * Import files to After Effects with folder organization
   */
  static async importToAfterEffectsOrganized(categorizedFiles: Record<string, any[]>, projectName: string) {
    const payload = JSON.stringify({ categorizedFiles, projectName });
    const script = `importFilesToAfterEffectsOrganized('${payload.replace(/'/g, "\\'")}')`;
    return this.evalScript(script);
  }

  /**
   * Execute Edit Agent command
   */
  static async executeEditCommand(command: any) {
    const commandJson = JSON.stringify(command);
    const script = `executeEditCommand('${commandJson.replace(/'/g, "\\'")}')`;
    return this.evalScript(script);
  }

  /**
   * Get host application info
   */
  static getHostApplication(): 'premiere' | 'aftereffects' | 'unknown' {
    if (typeof window.__adobe_cep__ === 'undefined') {
      return 'unknown';
    }

    try {
      const hostEnv = window.__adobe_cep__.getHostEnvironment();
      const parsed = JSON.parse(hostEnv);
      const appId = parsed.appId || parsed.appName || '';

      // Adobe returns appId like "PPRO", "AEFT" or appName like "PPRO", "AEFT"
      if (appId.includes('PPRO') || appId.includes('Premiere')) return 'premiere';
      if (appId.includes('AEFT') || appId.includes('After Effects')) return 'aftereffects';
    } catch (err) {
      console.error('Failed to get host application:', err);
    }

    return 'unknown';
  }

  /**
   * Test CEP connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      const result = await this.evalScript('typeof app !== "undefined"');
      return result === true || result === 'true';
    } catch {
      return false;
    }
  }
}
