const plugin = require('./dist/index.js').default;

async function testPlugin() {
  console.log('--- Starting Plugin Integration Test ---');
  
  const mockInput = {
    worktree: '/Users/test/projects/my-awesome-app',
    directory: '/Users/test/projects/my-awesome-app',
    $: () => {},
  };

  const options = {
    threshold: 2
  };

  try {
    const hooks = await plugin(mockInput, options);
    console.log('[OK] Plugin initialized hooks:', Object.keys(hooks));

    const sysOutput = { system: [] };
    if (hooks['experimental.chat.system.transform']) {
      await hooks['experimental.chat.system.transform']({ sessionID: 'sess-1', model: {} }, sysOutput);
      console.log('[OK] experimental.chat.system.transform ran successfully. Output:', sysOutput);
    }

    const compOutput = { context: [] };
    if (hooks['experimental.session.compacting']) {
      await hooks['experimental.session.compacting']({ sessionID: 'sess-1' }, compOutput);
      console.log('[OK] experimental.session.compacting ran successfully. Output:', compOutput);
    }

    if (hooks['chat.message']) {
      console.log('Simulating message 1...');
      await hooks['chat.message']({ sessionID: 'sess-1' }, {});
      
      console.log('Simulating message 2 (should trigger mine)...');
      await hooks['chat.message']({ sessionID: 'sess-1' }, {});
      
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('[OK] chat.message tested.');
    }

  } catch (error) {
    console.error('[FAILED] Error running plugin test:', error);
  }
}

testPlugin();
