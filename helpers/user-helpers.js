import { API_ENDPOINT } from "./discord-helpers.js";

async function getUserInfo(token) {
    const result = await fetch(`${API_ENDPOINT}/users/@me`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await result.json();

    if (!result.ok) {
        console.log(data);
        throw new Error("Failed to get user information");
    }

    return data;
}

function callBanApi(userId, method, auditLogReason = "") {
    return fetch(`${API_ENDPOINT}/guilds/${encodeURIComponent(process.env.GUILD_ID)}/bans/${encodeURIComponent(userId)}`, {
        method: method,
        headers: {
            "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            "X-Audit-Log-Reason": auditLogReason
        }
    });
}

async function getCliptokBan(userid) {
    const result = await fetch(`${process.env.CLIPTOK_API_ENDPOINT}/bans/${encodeURIComponent(userid)}`, {
        method: "GET",
        headers: {
            "Authorization": process.env.CLIPTOK_API_TOKEN
        }
    });

    if (result.ok){
        return await result.json();
    } else {
        return null;
    }
}

async function getCliptokBlock(userid) {
    try {
        const result = await fetch(`${process.env.CLIPTOK_API_ENDPOINT}/appealBlocks/${encodeURIComponent(userid)}`, {
            method: "GET",
            headers: {
                "Authorization": process.env.CLIPTOK_API_TOKEN
            }
        });
    
        if (result.status === 200){
            // redis-exposer returns 200 if it exists
            return true;
        } else {
            // anything else, either fall through as allowed or it doesnt exist
            return false;
        }
    
    } catch {
        return false;
    }
}


async function getBan(userId) {
    const result = await callBanApi(userId, "GET");

    if (result.ok) {
        return await result.json();
    } else if (result.status === 404) {
        return null;
    } else {
        console.log(await result.json());
        throw new Error("Failed to get user ban");
    }
}

async function unbanUser(userId, reason) {
    const result = await callBanApi(userId, "DELETE", reason);

    if (!result.ok && result.status !== 404) {
        console.log(await result.json());
        throw new Error("Failed to unban user");
    }
}

async function isBlocked(userId) {
    if (process.env.BLOCKED_USERS) {
        const blockedUsers = process.env.BLOCKED_USERS.replace(/"/g, "").split(",").filter(Boolean);
        if (blockedUsers.indexOf(userId) > -1) {
            return true;
        }
    }

    if (process.env.CLIPTOK_API_TOKEN != null && process.env.CLIPTOK_API_ENDPOINT != null) {
        return (await getCliptokBlock(userId));
    }

    return false;
}

export { getUserInfo, getBan, unbanUser, isBlocked, getCliptokBan };

