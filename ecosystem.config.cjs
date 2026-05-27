/** PM2 - Liahona Discord/OpenAI runtime. */
module.exports = {
  apps: [
    {
      name: "liahona",
      script: "index.js",
      cwd: "C:/Projects/Liahona",
      interpreter: "node",
      windowsHide: true,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
    },
  ],
};
