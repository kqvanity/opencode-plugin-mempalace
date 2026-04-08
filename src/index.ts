import { wakeUp, mine, isInitialized, initialize } from './mempalace-cli.js';
import { StateManager } from './state.js';
import { getWingFromPath } from './utils.js';

export default async function mempalacePlugin(input: any, options?: any): Promise<any> {
  const dir = input.worktree || input.directory || process.cwd();
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

  const MAX_MEMORY_LENGTH = 4000;

  return {
    'experimental.session.compacting': async (
      { sessionID }: { sessionID: string },
      output: { context: string[]; prompt?: string },
    ) => {
      await ensureInitialized();
      const memory = await wakeUp(wing);
      if (memory) {
        const truncatedMemory =
          memory.length > MAX_MEMORY_LENGTH
            ? memory.substring(0, MAX_MEMORY_LENGTH) + '\n...[Memory Truncated]'
            : memory;
        output.context.push(truncatedMemory);
      }
    },

    'experimental.chat.system.transform': async (
      { sessionID, model }: { sessionID?: string; model: any },
      output: { system: string[] },
    ) => {
      await ensureInitialized();
      const memory = await wakeUp(wing);
      if (memory) {
        const truncatedMemory =
          memory.length > MAX_MEMORY_LENGTH
            ? memory.substring(0, MAX_MEMORY_LENGTH) + '\n...[Memory Truncated]'
            : memory;
        output.system.push(truncatedMemory);
      }
    },

    'chat.message': async ({ sessionID }: { sessionID: string }, output: any) => {
      if (stateManager.incrementAndCheck(sessionID)) {
        if (!stateManager.acquireMiningLock(sessionID)) return;

        await ensureInitialized();
        mine(dir, 'convos', wing)
          .catch(() => {})
          .finally(() => {
            stateManager.releaseMiningLock(sessionID);
          });
      }
    },
  };
}
