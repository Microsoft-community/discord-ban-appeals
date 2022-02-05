const vars = [
    "DISCORD_CLIENT_ID",
    "DISCORD_CLIENT_SECRET",
    "DISCORD_BOT_TOKEN",
    "DISCORD_PUBLIC_KEY",
    "GUILD_ID",
    "APPEALS_CHANNEL",
    "JWT_SECRET"
];

vars.forEach(e => {
    if(!process.env[e]) {
        throw new Error(`${e} is not defined`);
    }
});