module.exports = {
  apps: [
    {
      script: "./index.js",
      name: "app",
      exec_mode: "cluster",
      instances: 1,
      watch: true,
      env_production: {
        NODE_ENV: "production",
      },
      env_development: {
        NODE_ENV: "development",
      },
    },
  ],
};
