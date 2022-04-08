import { reply, editMessage, editOriginalMessage } from "../helpers/interaction-helpers.js";

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

    message.content = `Appeal from <@${userId}> (${userId}) accepted by <@${body.member.user.id}>, currently pending unban`;
    message.embeds[0].color = 16705373;
    message.components[0].components = [
        {
            type: 2,
            custom_id: `unban_${userId}_${body.member.user.id}`,
            style: 2,
            label: "Unban user",
        }
    ];
    

    if(doUserCheck) {
        editMessage(res, message);
    } else {
        await editOriginalMessage(message);
    }
}

function getColour() {
    return [15548997];
}

export { request, getColour };