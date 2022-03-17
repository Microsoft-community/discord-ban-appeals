"use strict";

import nacl from "tweetnacl";
import fetch from "node-fetch";
import { unbanUser } from "./helpers/user-helpers.js";
import { API_ENDPOINT } from "./helpers/discord-helpers.js";

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
            const userId = body.data.custom_id.split("_")[1];
            let newMessage = body.message;

            switch (body.data.component_type) {
                case 2:
                    switch (state) {
                        case "accept":
                            if (newMessage.embeds[0].fields[4]) {
                                const rejectCount = newMessage.embeds[0].fields[4].value.split("\n").length;
                                reply(res, {
                                    content: `Are you sure you want to accept this appeal? ${rejectCount} ${rejectCount == 1 ? "user has" : "users have"} rejected this appeal.`,
                                    flags: 64,
                                    components: [{
                                        type: 1,
                                        components: [{
                                            type: 2,
                                            custom_id: `confirmaccept_${userId}`,
                                            style: 3,
                                            label: "Yes, I'm sure",
                                        }]
                                    }]
                                });
                                return;
                            } else {
                                newMessage.content = `Appeal from <@${userId}> (${userId}) accepted by <@${body.member.user.id}>, currently pending unban`;
                                newMessage.embeds[0].color = 16705372;
                                newMessage.components[0].components = [
                                    {
                                        type: 2,
                                        custom_id: `unban_${userId}_${body.member.user.id}`,
                                        style: 2,
                                        label: "Unban user",
                                    }
                                ];
                            }

                            editMessage(res, newMessage);
                            return;
                            
                        case "unban":
                            if (body.data.custom_id.split("_")[2] && body.data.custom_id.split("_")[2] !== body.member.user.id) {
                                reply(res, {
                                    content: `Someone else accepted this appeal, are you sure you want to unban them?`,
                                    flags: 64,
                                    components: [{
                                        type: 1,
                                        components: [{
                                            type: 2,
                                            custom_id: `confirmunban_${userId}_${body.member.user.id}`,
                                            style: 3,
                                            label: "Yes, I'm sure",
                                        }]
                                    }]
                                });
                                return;
                            } else {
                                try {
                                    await unbanUser(userId, `[Unban by ${body.member.user.username}#${body.member.user.discriminator}]: Ban appeal accepted.`);
                                } catch (e) {
                                    console.error(e);
                                    reply(res, {
                                        content: "An error occurred, please inform the form owner about this!",
                                        flags: 64,
                                    });
                                    return;
                                }

                                newMessage.content = `Appeal from <@${userId}> accepted by <@${body.member.user.id}> and user unbanned, currently in progress (${userId})`;
                                newMessage.embeds[0].color = 16705372;
                                newMessage.components[0].components = [
                                    {
                                        type: 2,
                                        custom_id: `complete_${userId}_${body.member.user.id}`,
                                        style: 2,
                                        label: "Mark as complete",
                                    }
                                ];
                            }

                            editMessage(res, newMessage);
                            return;

                        case "reject":
                            newMessage.content = `Appeal from <@${userId}> rejected (${userId})`;
                            newMessage.embeds[0].color = 15548997;
                            if (!newMessage.embeds[0].fields[4]) {
                                newMessage.embeds[0].fields[4] = {
                                    name: "Rejected by",
                                    value: `<@${body.member.user.id}>`
                                };
                            } else if (!newMessage.embeds[0].fields[4].value.includes(`<@${body.member.user.id}>`)) {
                                newMessage.embeds[0].fields[4].value += `\n<@${body.member.user.id}>`;
                            }

                            editMessage(res, newMessage);
                            return;

                        case "complete":
                            if (body.data.custom_id.split("_")[2] !== body.member.user.id) {
                                reply(res, {
                                    content: "Someone else unbanned this user, are you sure you want to mark this as complete?",
                                    flags: 64,
                                    components: [{
                                        type: 1,
                                        components: [{
                                            type: 2,
                                            custom_id: `confirmcomplete_${userId}`,
                                            style: 3,
                                            label: "Yes, I'm sure",
                                        }]
                                    }]
                                });
                            } else {
                                newMessage.content = `Appeal from <@${userId}> (${userId}) accepted, user has been notified`;
                                newMessage.embeds[0].color = 3908957;
                                newMessage.components = [];

                                editMessage(res, newMessage);
                            }

                            return;

                        case "confirmaccept":
                            const oldMessage = await getRepliedMessage(body);
                            if(oldMessage.embeds[0].color !== 15548997) {
                                reply(res, {
                                    content: "This action cannot be performed now!",
                                    flags: 64
                                });
                                return;
                            }

                            const editedMessage = {
                                content: `Appeal from <@${userId}> accepted by <@${body.member.user.id}>, currently pending unban (${userId})`,
                                embeds: [
                                    Object.assign(oldMessage.embeds[0], { color: 16705372 })
                                ],
                                components: [{
                                    type: 1,
                                    components: [{
                                        type: 2,
                                        custom_id: `unban_${userId}_${body.member.user.id}`,
                                        style: 2,
                                        label: "Unban user",
                                    }]
                                }]
                            };

                            newMessage.components[0].components[0].disabled = true;

                            await editRepliedMessage(editedMessage, body);
                            editMessage(res, newMessage);
                            return;
                            
                        case "confirmunban":
                            const oldMessage2 = await getRepliedMessage(body);
                            if(oldMessage2.embeds[0].color !== 16705372) {
                                reply(res, {
                                    content: "This action cannot be performed now!",
                                    flags: 64
                                });
                                return;
                            }

                            try {
                                await unbanUser(userId, `[Unban by ${body.member.user.username}#${body.member.user.discriminator}]: Ban appeal accepted.`);
                            } catch (e) {
                                console.error(e);
                                reply(res, {
                                    content:
                                        "An error occurred, please inform the site owner about this!",
                                    flags: 64,
                                });
                                return;
                            }

                            const editedMessage2 = {
                                content: `Appeal from <@${userId}> accepted by <@${body.data.custom_id.split("_")[2]}>, currently in progress (${userId})`,
                                embeds: [
                                    Object.assign(oldMessage2.embeds[0], { color: 16705372 })
                                ],
                                components: [{
                                    type: 1,
                                    components: [{
                                        type: 2,
                                        custom_id: `complete_${userId}_${body.data.custom_id.split("_")[2]}`,
                                        style: 2,
                                        label: "Mark as complete",
                                    }]
                                }]
                            };

                            newMessage.components[0].components[0].disabled = true;

                            await editRepliedMessage(editedMessage2, body);
                            editMessage(res, newMessage);
                            return;

                        case "confirmcomplete":
                            const oldMessage3 = await getRepliedMessage(body);
                            if(oldMessage3.embeds[0].color !== 16705372) {
                                reply(res, {
                                    content: "This action cannot be performed now!",
                                    flags: 64
                                });
                                return;
                            }

                            const editedMessage3 = {
                                content: `Appeal from <@${userId}> accepted, user has been notified`,
                                embeds: [
                                    Object.assign(oldMessage3.embeds[0], { color: 3908957 })
                                ],
                                components: []
                            };

                            newMessage.components[0].components[0].disabled = true;

                            await editRepliedMessage(editedMessage3, body);
                            editMessage(res, newMessage);
                            return;

                    }
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

function verifyRequest(request) {
    const signature = request.headers['x-signature-ed25519'];
    const timestamp = request.headers['x-signature-timestamp'];

    return nacl.sign.detached.verify(
        Buffer.from(timestamp + JSON.stringify(request.body)),
        Buffer.from(signature, "hex"),
        Buffer.from(process.env.DISCORD_PUBLIC_KEY, "hex")
    );
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

async function editRepliedMessage(newMessage, body) {
    const res = await fetch(API_ENDPOINT + `/channels/${body.message.message_reference.channel_id}/messages/${body.message.message_reference.message_id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`
        },
        body: JSON.stringify(newMessage)
    });
    const data = await res.json();

    if (!res.ok) {
        console.log(data);
        throw new Error("Something went wrong when attempting to edit original message");
    }
}

function reply(response, message) {
    response.status(200).json({
        type: 4,
        data: message,
    });
}