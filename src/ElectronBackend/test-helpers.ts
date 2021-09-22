import fs from 'fs';

export function createTempFolder(): string {
  return fs.mkdtempSync(`temp-folder-${Date.now()}`);
}

export function deleteFolder(folderName: string): void {
  fs.rmdirSync(folderName, { recursive: true });
}
