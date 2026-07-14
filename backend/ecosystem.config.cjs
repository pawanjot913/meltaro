/**
 * PM2 Ecosystem Configuration
 * ----------------------------
 * Usage:
 *   npm run build          # compile TypeScript first
 *   npm run start:pm2      # start with PM2
 *   npm run logs:pm2       # tail logs
 *   npm run stop:pm2       # stop
 *   pm2 save               # persist process list across reboots
 *   pm2 startup            # generate OS-level startup script
 *
 * PM2 gives you:
 *   - Automatic restart on crash
 *   - Zero-downtime reload on deploy (pm2 reload meltaro-api)
 *   - Built-in process monitoring (pm2 monit)
 *   - Log rotation via pm2-logrotate module
 */

module.exports = {
  apps: [
    {
      name: 'meltaro-api',
      script: './dist/server.js',

      // Use cluster mode to take advantage of all CPU cores.
      // Each worker is a full copy of the app — stateless design required
      // (no in-memory state shared between workers, which our app satisfies
      // since all state lives in MongoDB).
      instances: 'max',
      exec_mode: 'cluster',

      // Restart the process if memory exceeds 512 MB
      max_memory_restart: '512M',

      // Environment variables — override with your actual values or use
      // a secrets manager instead of hardcoding here
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },

      // PM2 built-in log paths (in addition to Winston file logs)
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',

      // Wait 3 s between restart attempts to avoid a crash loop hammering
      // the DB with rapid reconnect attempts
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s',

      // Graceful shutdown — PM2 sends SIGINT, waits kill_timeout ms,
      // then force kills if the process hasn't exited
      kill_timeout: 10000,
      wait_ready: true,
      listen_timeout: 15000,
    },
  ],
};
