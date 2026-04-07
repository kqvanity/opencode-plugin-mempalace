import { wakeUp, mine, isInitialized, initialize } from './mempalace-cli';
import { StateManager } from './state';
import { getWingFromPath } from './utils';

export default async function mempalacePlugin(
  input: any,
  options?: any
): Promise<any> {
  const dir = input.worktree || input.directory;
  const wing = getWingFromPath(dir);
  const threshold = (options?.threshold as number) || 15;
  const stateManager = new StateManager(threshold);

  let initializationChecked = false;

  const ensureInitialized = async () => {
    if (initializationChecked) return;
    const initialized = await isInitialized(dir);
    if (!initialized) {
      await initialize(dir);
    }
    initializationChecked = true;
  };

  return {
    'experimental.session.compacting': async (
      { sessionID }: { sessionID: string },
      output: { context: string[]; prompt?: string }
    ) => {
      await ensureInitialized();
      const memory = await wakeUp(wing);
      if (memory) {
        output.context.push(memory);
      }
    },
    
    'experimental.chat.system.transform': async (
      { sessionID, model }: { sessionID?: string; model: any },
      output: { system: string[] }
    ) => {
      await ensureInitialized();
      const memory = await wakeUp(wing);
      if (memory) {
        output.system.push(memory);
      }
    },

    'chat.message': async (
      { sessionID }: { sessionID: string },
      output: any
    ) => {
      if (stateManager.incrementAndCheck(sessionID)) {
        await ensureInitialized();
        mine(dir, 'convos', wing).catch(() => {});
      }
    },
  };
}

