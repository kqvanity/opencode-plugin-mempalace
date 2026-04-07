import { wakeUp, mine, isInitialized, initialize } from './mempalace-cli';
import execa from 'execa';

jest.mock('execa');

describe('mempalace-cli', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls wake-up with the correct wing', async () => {
    (execa as unknown as jest.Mock).mockResolvedValue({ stdout: 'L0 context\nL1 context' });
    const result = await wakeUp('test_wing');
    expect(execa).toHaveBeenCalledWith('python3', ['-m', 'mempalace', 'wake-up', '--wing', 'test_wing']);
    expect(result).toBe('L0 context\nL1 context');
  });

  it('calls mine with the correct arguments', async () => {
    (execa as unknown as jest.Mock).mockResolvedValue({ stdout: 'mined successfully' });
    await mine('/test/dir', 'convos', 'test_wing');
    expect(execa).toHaveBeenCalledWith('python3', [
      '-m',
      'mempalace',
      'mine',
      '/test/dir',
      '--mode',
      'convos',
      '--wing',
      'test_wing'
    ]);
  });
  
  it('handles missing mempalace gracefully', async () => {
    (execa as unknown as jest.Mock).mockRejectedValue(new Error("ENOENT: no such file or directory, exec 'python3'"));
    const result = await wakeUp('test_wing');
    expect(result).toBeNull();
  });

  it('checks if palace is initialized', async () => {
    (execa as unknown as jest.Mock).mockResolvedValue({ stdout: 'Palace OK' });
    const result = await isInitialized('/test/dir');
    expect(execa).toHaveBeenCalledWith('python3', ['-m', 'mempalace', 'status', '--palace', '/test/dir/.mempalace/palace']);
    expect(result).toBe(true);
  });

  it('initializes non-interactively with newline input', async () => {
    (execa as unknown as jest.Mock).mockResolvedValue({ stdout: 'Init OK' });
    await initialize('/test/dir');
    expect(execa).toHaveBeenCalledWith('python3', ['-m', 'mempalace', 'init', '--yes', '/test/dir'], { input: '\n' });
  });
});



