"use strict";

import fetch from "node-fetch";
import { getBan, getUserInfo, isBlocked } from "./helpers/user-helpers.js";
import { createJWT } from "./helpers/jwt-helpers.js";

export default async (req, res) => {
    if(req.method !== "GET") {
        res.status(405).send("Invalid Method");
        return;
    }

    if(!req.query.code) {
        res.status(400).send("Incomplete or malformed request");
        return;
    }

    if(!verifyCSRF(req)) {
        res.status(403).send("Unauthorized");
        return;
    }

    try {
        const result = await fetch("https://discord.com/api/oauth2/token", {
                method: "POST",
                body: new URLSearchParams({
                    client_id: process.env.DISCORD_CLIENT_ID,
                    client_secret: process.env.DISCORD_CLIENT_SECRET,
                    grant_type: "authorization_code",
                    code: req.query.code,
                    redirect_uri: new URL("/api/oauth-callback", `https://${req.headers.host}`).toString(),
                    scope: "identify"
                })
            });
        const data = await result.json();
    
        if(!result.ok) {
            console.log(data);
            throw new Error("Failed to get user access token");
        }

        const user = await getUserInfo(data.access_token);
        if(isBlocked(user.id)) {
            res.redirect(303, `/error.html?msg=${encodeURIComponent("You cannot submit ban appeals with this Discord account.")}`);
        }

        if(!process.env.SKIP_BAN_CHECK) {
            const ban = await getBan(user.id);

            if(!ban) {
                res.redirect(303, "/error.html");
            }
        }

        const userPublic = {
            id: user.id,
            avatar: user.avatar,
            username: user.username,
            discriminator: user.discriminator
        };
        let url = `/form.html?token=${encodeURIComponent(createJWT(userPublic, data.expires_in))}`;
        if (req.query.state) {
            url += `&state=${encodeURIComponent(req.query.state)}`;
        }

        res.redirect(303, url);

    } catch(e) {
        console.error(e);
        res.status(500).send("An internal error occurred, please inform this site\'s owner about this incident!");
    }
    
}

function parseCookies(str) {
    return str
        .split(';')
        .map(v => v.split('='))
        .reduce((acc, v) => {
            acc[v[0]] = v[1];
            return acc;
        }, {});
}

function verifyCSRF(req) {
    if (req.query.state && req.headers.cookie) {
        const cookies = parseCookies(req.headers.cookie);
        if (cookies["__Secure-CSRFState"]) {
            return cookies["__Secure-CSRFState"] ===  req.query.state;
        }
    }

    return false;
}