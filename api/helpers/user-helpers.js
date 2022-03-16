import fetch from "node-fetch";
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

function callBanApi(userId, method) {
    return fetch(`${API_ENDPOINT}/guilds/${encodeURIComponent(process.env.GUILD_ID)}/bans/${encodeURIComponent(userId)}`, {
        method: method,
        headers: {
            "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`
        }
    });
}

function callCliptokBanApi(userid) {
    return fetch(`${process.env.CLIPTOK_API_ENDPOINT}/bans/${encodeURIComponent(userid)}`, {
        method: "GET",
        headers: {
            "Authorization": process.env.CLIPTOK_API_TOKEN
        }
    });
}

async function getCliptokBanObject(userid) {
    const result = await callCliptokBanApi(userid);
    console.log(result)

    if (result.ok){
        return await result.json();
    } else {
        return null;
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

async function unbanUser(userId) {
    const result = await callBanApi(userId, "DELETE");

    if (!result.ok && result.status !== 404) {
        console.log(await result.json());
        throw new Error("Failed to unban user");
    }
}

function isBlocked(userId) {
    if (process.env.BLOCKED_USERS) {
        const blockedUsers = process.env.BLOCKED_USERS.replace(/"/g, "").split(",").filter(Boolean);
        if (blockedUsers.indexOf(userId) > -1) {
            return true;
        }
    }

    return false;
}

export { getUserInfo, getBan, unbanUser, isBlocked, getCliptokBanObject };

