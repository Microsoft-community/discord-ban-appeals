import { REJECTED_COLOUR } from "../utils/colour";
import { editMessage } from "../utils/response";
import { ButtonHandler } from "../utils/types";

export default {
	async handle(body, apiClient) {
		const message = body.message;
		const userId = body.data.custom_id.split("_")[1];

		if (!body.member || !message.embeds[0].fields) throw new Error("how");

		message.content = `Appeal from <@${userId}> (${userId}) rejected`;
		message.embeds[0].color = REJECTED_COLOUR;
		if (!message.embeds[0].fields[4]) {
			message.embeds[0].fields[4] = {
				name: "Rejected by",
				value: `<@${body.member.user.id}>`,
			};
		} else if (
			!message.embeds[0].fields[4].value.includes(`<@${body.member.user.id}>`)
		) {
			message.embeds[0].fields[4].value += `\n<@${body.member.user.id}>`;
		}
		return editMessage(message);
	},
} satisfies ButtonHandler;
