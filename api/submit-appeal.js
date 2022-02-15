"use strict";

import fetch from "node-fetch";
import { decodeJWT } from "./helpers/jwt-helpers.js";
import { isBlocked, getBan } from "./helpers/user-helpers.js";
import { API_ENDPOINT, MAX_EMBED_FIELD_CHARS, MAX_EMBED_FOOTER_CHARS } from "./helpers/discord-helpers.js";


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

        const message = {
            content: `New appeal submitted by <@${userInfo.id}>: (${userInfo.id})`,
            embeds: [{
                timestamp: new Date().toISOString(),
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
