import { reply, editMessage, editOriginalMessage } from "../helpers/interaction-helpers.js";
import { unbanUser } from "../helpers/user-helpers.js"

async function request(res, body, doUserCheck = true) {
    const message = body.message;
    const userId = body.data.custom_id.split("_")[1];

    if (doUserCheck && message.embeds[0].fields[4]) {
        const rejectCount = message.embeds[0].fields[4].value.split("\n").length;
        reply(res, {
            content: `Are you sure you want to accept this appeal? ${rejectCount} ${rejectCount == 1 ? "user has" : "users have"} rejected this appeal.`,
            flags: 64,
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    custom_id: `confirm_${body.data.custom_id}`,
                    style: 3,
                    label: "Yes, I'm sure",
                }]
            }]
        });
        return;
    }

    if (doUserCheck && body.data.custom_id.split("_")[2] && body.data.custom_id.split("_")[2] !== body.member.user.id) {
        reply(res, {
            content: `Someone else accepted this appeal, are you sure you want to unban them?`,
            flags: 64,
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    custom_id: `confirm_${body.data.custom_id}`,
                    style: 3,
                    label: "Yes, I'm sure",
                }]
            }]
        });
        return;
    } else {
        try {
            await unbanUser(userId, `[Unban by ${body.member.user.username}#${body.member.user.discriminator}] Ban appeal accepted.`);
        } catch (e) {
            console.error(e);
            reply(res, {
                content: "An error occurred when attempting to unban user.",
                flags: 64,
            });
            return;
        }

        message.content = `Appeal from <@${userId}> (${userId}) accepted by <@${body.member.user.id}> and user unbanned, currently in progress`;
        message.embeds[0].color = 16705372;
        message.components[0].components = [
            {
                type: 2,
                custom_id: `complete_${userId}_${body.member.user.id}`,
                style: 2,
                label: "Mark as complete",
            }
        ];
    }

    if(doUserCheck) {
        editMessage(res, message);
    } else {
       await editOriginalMessage(message);
    }
}

function getColour() {
    return [16705373, 15548997];
}

export { request, getColour };