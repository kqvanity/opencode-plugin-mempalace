import { wakeUp, mine } from './mempalace-cli';
import { StateManager } from './state';
import { getWingFromPath } from './utils';

export default async function mempalacePlugin(
  input: any,
  options?: any
): Promise<any> {
  const wing = getWingFromPath(input.worktree || input.directory);
  const threshold = (options?.threshold as number) || 15;
  const stateManager = new StateManager(threshold);

  return {
    'experimental.session.compacting': async (
      { sessionID }: { sessionID: string },
      output: { context: string[]; prompt?: string }
    ) => {
      const memory = await wakeUp(wing);
      if (memory) {
        output.context.push(memory);
      }
    },
    
    'experimental.chat.system.transform': async (
      { sessionID, model }: { sessionID?: string; model: any },
      output: { system: string[] }
    ) => {
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
        mine(input.worktree || input.directory, 'convos', wing).catch((err) => {
          console.error('[MemPalace] Failed to mine context:', err);
        });
      }
    },
  };
}

