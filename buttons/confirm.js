import { reply, getRepliedMessage, editMessage } from "../helpers/interaction-helpers.js";
import v8 from "v8";

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

    // weird thing to clone object
    // node 17 includes a better way to do this but vercel runs on 14 for now
    // TODO use structuredClone when vercel gets it
    
    const newBody = v8.deserialize(v8.serialize(body));            
    newBody.message = oldMessage;                                  
    newBody.data.custom_id = body.data.custom_id.substring(8);     
    console.log(body.data.custom_id)
    await request(res, newBody, false);
    await editMessage(res, body.message);
}

export { request };