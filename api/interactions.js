"use strict";

import { verifyRequest, reply } from "../helpers/interaction-helpers.js"

export default async (req, res) => {
    if (!verifyRequest(req)) {
        console.log("Unverified request sent!");
        res.status(401).send("Invalid signature");
        return;
    }

    const body = req.body;

    if (body.application_id !== process.env.DISCORD_CLIENT_ID) {
        res.status(400);
        return;
    }

    switch (body.type) {
        case 1:
            res.status(200).json({
                type: 1,
            });
            break;

        case 3:
            const state = body.data.custom_id.split("_")[0];
            
            switch (body.data.component_type) {
                case 2:
                    const { request } = await import(`../buttons/${state}.js`);            
                    await request(res, body);
            }

            break;

        default:
            reply(res, {
                type: 4,
                data: {
                    content: "This interaction is not supported!",
                    flags: 64,
                },
            });
    }
};