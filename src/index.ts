import { wakeUp, mine, mineSync, isInitialized, initialize } from './mempalace-cli.js';
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

  let isFlushing = false;
  const flushDirtySessions = () => {
    if (isFlushing) return;
    isFlushing = true;
    const dirtySessions = stateManager.getDirtySessions();
    if (dirtySessions.length > 0) {
      mineSync(dir, 'convos', wing);
      for (const id of dirtySessions) {
        stateManager.resetCount(id);
      }
    }
  };

  process.on('exit', flushDirtySessions);
  process.on('SIGINT', () => {
    flushDirtySessions();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    flushDirtySessions();
    process.exit(143);
  });

  return {
    event: async ({ event }: { event: any }) => {
      if (
        event.type === 'session.idle' ||
        event.type === 'session.deleted' ||
        (event.type === 'session.status' && event.properties?.status?.type === 'idle')
      ) {
        const sessionID = event.properties?.sessionID || event.properties?.info?.id;
        if (sessionID && stateManager.hasPendingMessages(sessionID)) {
          if (!stateManager.acquireMiningLock(sessionID)) return;

          await ensureInitialized();
          mine(dir, 'convos', wing)
            .catch(() => {})
            .finally(() => {
              stateManager.releaseMiningLock(sessionID);
              stateManager.resetCount(sessionID);
            });
        }
      }
    },

    'experimental.session.compacting': async (
      _: any,
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

    'experimental.chat.system.transform': async (_: any, output: { system: string[] }) => {
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

    'chat.message': async ({ sessionID }: { sessionID: string }) => {
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
