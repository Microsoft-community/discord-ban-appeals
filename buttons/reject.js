import { REJECTED_COLOUR } from "../helpers/colour-helpers.js";
import { editMessage } from "../helpers/interaction-helpers.js";

async function request(res, body) {
    const message = body.message;
    const userId = body.data.custom_id.split("_")[1]

    message.content = `Appeal from <@${userId}> (${userId}) rejected`;
    message.embeds[0].color = REJECTED_COLOUR;
    if (!message.embeds[0].fields[4]) {
        message.embeds[0].fields[4] = {
            name: "Rejected by",
            value: `<@${body.member.user.id}>`
        };
    } else if (!message.embeds[0].fields[4].value.includes(`<@${body.member.user.id}>`)) {
        message.embeds[0].fields[4].value += `\n<@${body.member.user.id}>`;
    }
    await editMessage(res, message);
}

export { request };