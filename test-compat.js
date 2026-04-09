import { createRequire } from 'module';
const require = createRequire(import.meta.url);

async function run() {
  console.log('Loading mempalace plugin...');
  const mempalacePlugin = (await import('./dist/index.js')).default;
  const mempalaceHooks = await mempalacePlugin({ directory: process.cwd() }, { threshold: 15 });
  console.log('Mempalace loaded successfully.');

  console.log('Loading oh-my-openagent...');
  // We point directly to the dist/index.js of oh-my-openagent
  const omoPluginPath =
    '/Users/kevin/.cache/opencode/packages/oh-my-openagent@latest/node_modules/oh-my-openagent/dist/index.js';
  const omoPlugin = (await import(omoPluginPath)).default;
  const mockContext = {
    directory: process.cwd(),
    worktree: process.cwd(),
    client: {
      tui: {
        toast: () => {},
        prompt: { append: () => {} },
      },
    },
    $: async () => {},
  };
  const omoHooks = await omoPlugin(mockContext, {});
  console.log('oh-my-openagent loaded successfully.');

  console.log('\n--- Testing `experimental.session.compacting` ---');
  const compactOutput = { context: [] };
  if (mempalaceHooks['experimental.session.compacting']) {
    await mempalaceHooks['experimental.session.compacting'](
      { sessionID: 'test-sess' },
      compactOutput,
    );
  }
  if (omoHooks['experimental.session.compacting']) {
    await omoHooks['experimental.session.compacting']({ sessionID: 'test-sess' }, compactOutput);
  }
  console.log('Compacting output context length:', compactOutput.context.length);

  console.log('\n--- Testing `experimental.chat.system.transform` ---');
  const sysOutput = { system: [] };
  if (mempalaceHooks['experimental.chat.system.transform']) {
    await mempalaceHooks['experimental.chat.system.transform'](
      { sessionID: 'test-sess', model: {} },
      sysOutput,
    );
  }
  if (omoHooks['experimental.chat.system.transform']) {
    await omoHooks['experimental.chat.system.transform'](
      { sessionID: 'test-sess', model: {} },
      sysOutput,
    );
  }
  console.log('System transform output length:', sysOutput.system.length);

  console.log('\n--- Testing `chat.message` ---');
  const msgOutput = { message: { content: 'test' }, parts: [] };
  const msgInput = { sessionID: 'test-sess', agent: 'test-agent' };
  if (mempalaceHooks['chat.message']) {
    await mempalaceHooks['chat.message'](msgInput, msgOutput);
  }
  if (omoHooks['chat.message']) {
    await omoHooks['chat.message'](msgInput, msgOutput);
  }
  console.log('chat.message executed successfully for both.');

  console.log('\n--- Testing `event` (soft exit) ---');
  if (mempalaceHooks.event) {
    await mempalaceHooks.event({
      event: { type: 'session.idle', properties: { sessionID: 'test-sess' } },
    });
  }
  if (omoHooks.event) {
    await omoHooks.event({
      event: { type: 'session.idle', properties: { sessionID: 'test-sess' } },
    });
  }
  console.log('Event executed successfully for both.');

  console.log('\nAll compatibility checks passed!');
  process.exit(0);
}

run().catch((e) => {
  console.error('Compatibility error:', e);
  process.exit(1);
});
