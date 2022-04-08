import { reply, editMessage, editOriginalMessage } from "../helpers/interaction-helpers.js";

async function request(res, body, doUserCheck = true) {
    const message = body.message;
    const userId = body.data.custom_id.split("_")[1];

    if (doUserCheck && body.data.custom_id.split("_")[2] !== body.member.user.id) {
        reply(res, {
            content: "Someone else unbanned this user, are you sure you want to mark this as complete?",
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

    message.content = `Appeal from <@${userId}> (${userId}) accepted, user has been notified`;
    message.embeds[0].color = 3908957;
    message.components = [];
    if(doUserCheck) {
        
        editMessage(res, message);
    } else {
        await editOriginalMessage(message);
    }
}

function getColour() {
    return [16705372];
}

export { request, getColour };