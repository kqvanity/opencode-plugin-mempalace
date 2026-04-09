import plugin from './dist/index.js';
import path from 'path';

async function run() {
  console.log('--- Testing MemPalace Plugin Lazy Initialization ---');

  const emptyDir = path.join(process.cwd(), 'node_modules');

  console.log('\n1. Initializing plugin for empty workspace...');
  const hooksEmpty = await plugin({ directory: emptyDir }, { threshold: 1 });

  const systemOutputEmpty = { system: [] };
  if (hooksEmpty['experimental.chat.system.transform']) {
    console.log('Triggering system.transform (should be instant & inject empty placeholder)...');
    const start = Date.now();
    await hooksEmpty['experimental.chat.system.transform'](
      { sessionID: 'sess-empty' },
      systemOutputEmpty,
    );
    const ms = Date.now() - start;
    console.log(`Finished in ${ms}ms.`);
    console.log('System Output:', systemOutputEmpty.system);
  }

  console.log('\n2. Initializing plugin for valid workspace...');
  const validDir = process.cwd();
  const hooksValid = await plugin({ directory: validDir }, { threshold: 1 });

  const systemOutputValid = { system: [] };
  if (hooksValid['experimental.chat.system.transform']) {
    console.log(
      'Triggering system.transform (should be non-blocking & inject initializing placeholder)...',
    );
    const start = Date.now();
    await hooksValid['experimental.chat.system.transform'](
      { sessionID: 'sess-valid' },
      systemOutputValid,
    );
    const ms = Date.now() - start;
    console.log(`Finished in ${ms}ms.`);
    console.log('System Output:', systemOutputValid.system);
  }

  console.log('\n3. Waiting 3 seconds for background initialization to complete...');
  await new Promise((r) => setTimeout(r, 3000));

  const systemOutputReady = { system: [] };
  if (hooksValid['experimental.chat.system.transform']) {
    console.log('Triggering system.transform again (should now have memory)...');
    await hooksValid['experimental.chat.system.transform'](
      { sessionID: 'sess-valid' },
      systemOutputReady,
    );
    console.log(
      'System Output (Memory retrieved):',
      systemOutputReady.system[0]?.substring(0, 100) + '...',
    );
  }

  console.log('\n4. Testing background mine with 2000ms TTFT protection...');
  if (hooksValid['chat.message']) {
    console.log('Triggering chat.message...');
    const start = Date.now();
    await hooksValid['chat.message']({ sessionID: 'sess-valid' });
    const ms = Date.now() - start;
    console.log(
      `chat.message returned to main thread in ${ms}ms. Mine is happening in background.`,
    );
  }

  await new Promise((r) => setTimeout(r, 2500));
  console.log('\nAll tests completed.');
  process.exit(0);
}

run().catch(console.error);
