import execa from 'execa';
import path from 'path';

export async function isInitialized(dir: string): Promise<boolean> {
  try {
    const palacePath = path.join(dir, '.mempalace', 'palace');
    await execa('python3', ['-m', 'mempalace', 'status', '--palace', palacePath]);
    return true;
  } catch (error) {
    return false;
  }
}

export async function initialize(dir: string): Promise<void> {
  try {
    await execa('python3', ['-m', 'mempalace', 'init', '--yes', dir], { input: '\n' });
  } catch (error) {
    console.warn(`Failed to initialize mempalace in ${dir}:`, error);
  }
}

export async function wakeUp(wing: string): Promise<string | null> {
  try {
    const { stdout } = await execa('python3', ['-m', 'mempalace', 'wake-up', '--wing', wing]);
    return stdout;
  } catch (error) {
    console.warn(`Failed to wake up mempalace:`, error);
    return null;
  }
}

export async function mine(dir: string, mode: string, wing: string): Promise<void> {
  try {
    await execa('python3', ['-m', 'mempalace', 'mine', dir, '--mode', mode, '--wing', wing]);
  } catch (error) {
    console.warn(`Failed to mine mempalace:`, error);
  }
}

