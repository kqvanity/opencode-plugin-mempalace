import execa from 'execa';

export async function wakeUp(wing: string): Promise<string | null> {
  try {
    const { stdout } = await execa('mempalace', ['wake-up', '--wing', wing]);
    return stdout;
  } catch (error) {
    console.warn(`Failed to wake up mempalace:`, error);
    return null;
  }
}

export async function mine(dir: string, mode: string, wing: string): Promise<void> {
  try {
    await execa('mempalace', ['mine', dir, '--mode', mode, '--wing', wing]);
  } catch (error) {
    console.warn(`Failed to mine mempalace:`, error);
  }
}
