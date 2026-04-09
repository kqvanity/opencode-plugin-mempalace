import plugin from './dist/index.js';

async function run() {
  const hooks = await plugin({ worktree: process.cwd() }, { threshold: 15 });

  console.log("Hooks created. Registering some pending messages...");
  
  // Add 3 pending messages to a session
  for (let i = 0; i < 3; i++) {
    await hooks['chat.message']({ sessionID: 'sess-1' });
  }

  console.log("Triggering session.idle event (soft exit)...");
  await hooks.event({ event: { type: 'session.idle', properties: { sessionID: 'sess-1' } } });
  
  console.log("Adding pending messages again...");
  for (let i = 0; i < 2; i++) {
    await hooks['chat.message']({ sessionID: 'sess-1' });
  }
  
  console.log("Process exiting (hard exit)...");
  process.emit('exit');
}

run().catch(console.error);
