module.exports = {
  apps: [{
    name: 'smart-shopping-api',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    max_restarts: 10,
    min_uptime: '10s',
    listen_timeout: 3000,
    kill_timeout: 5000,
    autorestart: true,
    cron_restart: '0 0 * * *', // Restart daily at midnight
    post_update: ['npm install'],
    pre_restart_delay: 5000
  }]
};