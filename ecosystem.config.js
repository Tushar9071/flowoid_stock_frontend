module.exports = {
    apps: [
        {
            name: "flowoid-frontend",
            script: ".next/standalone/server.js",
            instances: 1,
            autorestart: true,
            watch: false,
            env: {
                NODE_ENV: "production",
                PORT: 3000,
                HOSTNAME: "0.0.0.0",
            },
        },
    ],
}
