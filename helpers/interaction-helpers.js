import nacl from "tweetnacl";
import fetch from "node-fetch";
import { API_ENDPOINT } from "../helpers/discord-helpers.js"

function verifyRequest(req) {
    const signature = req.headers["x-signature-ed25519"];
    const timestamp = req.headers["x-signature-timestamp"];

    return nacl.sign.detached.verify(
        Buffer.from(timestamp + JSON.stringify(req.body)),
        Buffer.from(signature, "hex"),
        Buffer.from(process.env.DISCORD_PUBLIC_KEY, "hex")
    );
}

function reply(response, message) {
    response.status(200).json({
        type: 4,
        data: message,
    });
}

function editMessage(response, newMessage) {
    response.status(200).json({
        type: 7,
        data: newMessage,
    });
}

async function getRepliedMessage(body) {
    const res = await fetch(API_ENDPOINT + `/channels/${body.message.message_reference.channel_id}/messages/${body.message.message_reference.message_id}`, {
        method: "GET",
        headers: {
            "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`
        },
    });

    const data = await res.json();
    if (!res.ok) {
        console.log(data);
        throw new Error("Something went wrong when attempting to edit original message");
    }
    return data;
}

async function editOriginalMessage(message) {
    const res = await fetch(API_ENDPOINT + `/channels/${message.channel_id}/messages/${message.id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`
        },
        body: JSON.stringify(message)
    });
    const data = await res.json();

    if (!res.ok) {
        console.log(data);
        throw new Error("Something went wrong when attempting to edit original message");
    }
}

export { verifyRequest, reply, editMessage, getRepliedMessage, editOriginalMessage };