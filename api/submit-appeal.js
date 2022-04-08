"use strict";

import fetch from "node-fetch";
import { decodeJWT } from "../helpers/jwt-helpers.js";
import { isBlocked, getBan, getCliptokBan } from "../helpers/user-helpers.js";
import { API_ENDPOINT, MAX_EMBED_FIELD_CHARS, MAX_EMBED_FOOTER_CHARS } from "../helpers/discord-helpers.js";


export default async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Invalid method");
        return;
    }

    const body = req.body;
    const params = new URLSearchParams(body);
    const payload = {
        banReason: params.get("banReason") || undefined,
        appealText: params.get("appealText") || undefined,
        futureActions: params.get("futureActions") || undefined,
        token: params.get("token") || undefined
    };

    if (payload.banReason !== undefined &&
        payload.appealText !== undefined &&
        payload.futureActions !== undefined &&
        payload.token !== undefined) {

        const userInfo = decodeJWT(payload.token);
        if (isBlocked(userInfo.id)) {
            res.redirect(303, `/error.html?msg=${encodeURIComponent("You cannot submit ban appeals with this Discord account.")}`);
        }
        
        let timestamp = new Date();
        let strTimestamp = null;

        if (process.env.CLIPTOK_API_TOKEN != null && process.env.CLIPTOK_API_ENDPOINT != null) {
            const cliptokBanData = await getCliptokBan(userInfo.id);
            try {
                // handle things being missing, strTimestamp stays as null
                if (cliptokBanData != null && cliptokBanData.data != null && cliptokBanData.data.actionTime != null){
                    timestamp = new Date();
                    timestamp.setTime(Date.parse(cliptokBanData.data.actionTime));
                    strTimestamp = timestamp.toISOString();
                }
            }
            catch(e) {
                // the data from cliptok is just an extra, if it errors then completely ignore it instead of hard failing.
                // in this case strTimestamp would stay as null
                // ideally this shouldn't happen because of all the null checks above, but we still don't want appeals failing.
                console.log(e)
            }
        } else {
            // if the env vars aren't there, keep behaviour consistent with previous versions
            strTimestamp = new Date().toISOString();
        }

        const message = {
            content: `New appeal submitted by <@${userInfo.id}>: (${userInfo.id})`,
            embeds: [{
                timestamp: strTimestamp,
                fields: [
                    {
                        name: "Submitter",
                        value: `<@${userInfo.id}> (${userInfo.username}#${userInfo.discriminator})`
                    },
                    {
                        name: "Why were you banned?",
                        value: payload.banReason.slice(0, MAX_EMBED_FIELD_CHARS)
                    },
                    {
                        name: "Why do you feel you should be unbanned?",
                        value: payload.appealText.slice(0, MAX_EMBED_FIELD_CHARS)
                    },
                    {
                        name: "What will you do to avoid being banned in the future?",
                        value: payload.futureActions.slice(0, MAX_EMBED_FIELD_CHARS)
                    }
                ]
            }]
        }

        try {
            const ban = await getBan(userInfo.id, process.env.GUILD_ID, process.env.DISCORD_BOT_TOKEN);
            if (ban !== null && ban.reason) {
                message.embeds[0].footer = {
                    text: `Original ban reason: ${ban.reason}`.slice(0, MAX_EMBED_FOOTER_CHARS)
                };
            }
        } catch (e) {
            console.log(e);
        }

        if (!process.env.DISABLE_UNBAN_LINK) {
            message.components = [{
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 3,
                        label: "Accept appeal and unban",
                        custom_id: `unban_${userInfo.id}`
                    },
                    {
                        type: 2,
                        style: 2,
                        label: "Accept appeal",
                        custom_id: `accept_${userInfo.id}`
                    },
                    {
                        type: 2,
                        style: 4,
                        label: "Reject appeal",
                        custom_id: `reject_${userInfo.id}`
                    }
                ]
            }];
        }

        const result = await fetch(`${API_ENDPOINT}/channels/${encodeURIComponent(process.env.APPEALS_CHANNEL)}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`
            },
            body: JSON.stringify(message)
        });

        if (result.ok) {
            res.redirect(303, "/success.html");
        } else {
            console.log(JSON.stringify(await result.json()));
            throw new Error("Failed to submit message");
        }

    }
}
