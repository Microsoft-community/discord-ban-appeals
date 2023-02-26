import { reply, getRepliedMessage, editMessage } from "../helpers/interaction-helpers.js";

async function request(res, body) {
    const oldMessage = await getRepliedMessage(body);
    const type = body.data.custom_id.split("_")[1];
    const { request, getColour } = await import(`./${type}.js`);
    if(!getColour().includes(oldMessage.embeds[0].color)) {
        reply(res, {
            content: "This action cannot be performed now!",
            flags: 64
        });
        return;
    }
    body.message.components[0].components[0].disabled = true;
    
    const newBody = structuredClone(body);
    newBody.message = oldMessage;                                  
    newBody.data.custom_id = body.data.custom_id.substring(8);     
    await request(res, newBody, false);
    await editMessage(res, body.message);
}

export { request };