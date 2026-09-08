const { spawn } = require('child_process');
const path = require('path');

console.log('🌸 Starting CANDELA High-Availability Production Server...');

// Step 1: Run ensure-db.js first
function runDbCheck(callback) {
  const dbCheck = spawn('node', ['scripts/ensure-db.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
  });

  dbCheck.on('close', (code) => {
    if (code !== 0) {
      console.warn(`⚠️ ensure-db exited with code ${code}, proceeding to launch server...`);
    }
    callback();
  });
}

// Step 2: Start Next.js with automatic crash supervisor
function startSupervisor() {
  let restartCount = 0;
  let lastRestartTime = Date.now();

  function launch() {
    console.log('🚀 Launching Next.js Production Service (Port 3000)...');
    
    const server = spawn('node', ['node_modules/next/dist/bin/next', 'start'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: '3000',
      },
    });

    server.on('exit', (code, signal) => {
      const now = Date.now();
      if (now - lastRestartTime > 60000) {
        // Reset counter if running for more than 1 minute
        restartCount = 0;
      }
      lastRestartTime = now;
      restartCount++;

      console.error(`⚠️ Server process exited (code: ${code}, signal: ${signal}).`);
      
      if (restartCount > 10) {
        console.error('❌ Server restarted too many times in a short window. Waiting 10s before retry...');
        setTimeout(launch, 10000);
      } else {
        console.log(`🔄 Auto-recovering server in 2 seconds (Recovery attempt #${restartCount})...`);
        setTimeout(launch, 2000);
      }
    });
  }

  launch();
}

runDbCheck(startSupervisor);
