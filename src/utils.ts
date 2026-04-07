import path from 'path';

export function getWingFromPath(workspacePath: string): string {
  if (!workspacePath || workspacePath === '/') {
    return 'wing_general';
  }
  
  const baseName = path.basename(workspacePath);
  const sanitized = baseName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `wing_${sanitized}`;
}
