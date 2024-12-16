import { MessageFlags } from "discord-api-types/v10";
import { editMessage, reply } from "../utils/response";
import { ButtonHandler } from "../utils/types";
import accept from "./accept";
import complete from "./complete";
import unban from "./unban";

export default {
	async handle(body, apiClient) {
		const oldMessage = await apiClient.getRepliedMessage(body);
		console.log(body.data.custom_id);
		const type = body.data.custom_id.split("_")[1];
		let getColour;
		switch (type) {
			case "accept": {
				getColour = accept.getColour;
				break;
			}
			case "complete": {
				getColour = complete.getColour;
				break;
			}
			case "unban": {
				getColour = unban.getColour;
				break;
			}
		}

		if (
			getColour &&
			oldMessage.embeds[0].color &&
			!(getColour() as number[]).includes(oldMessage.embeds[0].color)
		) {
			return reply({
				content: "This action cannot be performed now!",
				flags: MessageFlags.Ephemeral,
			});
		}

		let handle;
		switch (type) {
			case "accept": {
				handle = accept.handle;
				break;
			}
			case "complete": {
				handle = complete.handle;
				break;
			}
			case "unban": {
				handle = unban.handle;
				break;
			}
		}

		if (body.message.components)
			body.message.components[0].components[0].disabled = true;

		const newBody = structuredClone(body);
		newBody.message = oldMessage;
		newBody.data.custom_id = body.data.custom_id.substring(8);
		await handle?.(newBody, apiClient, false);
		return editMessage(body.message);
	},
} satisfies ButtonHandler;
