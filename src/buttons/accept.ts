import { editMessage, editOriginalMessage, reply } from "../utils/response";
import { ACCEPTED_COLOUR, REJECTED_COLOUR } from "../utils/colour";
import {
	ButtonStyle,
	ComponentType,
	MessageFlags,
} from "discord-api-types/v10";
import { ButtonHandler } from "../utils/types";

export default {
	async handle(body, apiClient, doUserCheck = true) {
		const message = body.message;
		const userId = body.data.custom_id.split("_")[1];

		if (!body.member || !message.components) throw new Error("how");

		if (doUserCheck && message.embeds[0].fields?.[4]) {
			const rejectCount = message.embeds[0].fields[4].value.split("\n").length;
			return reply({
				content: `Are you sure you want to accept this appeal? ${rejectCount} ${rejectCount == 1 ? "user has" : "users have"} rejected this appeal.`,
				flags: MessageFlags.Ephemeral,
				components: [
					{
						type: ComponentType.ActionRow,
						components: [
							{
								type: ComponentType.Button,
								custom_id: `confirm_${body.data.custom_id}`,
								style: ButtonStyle.Success,
								label: "Yes, I'm sure",
							},
						],
					},
				],
			});
		}

		message.content = `Appeal from <@${userId}> (${userId}) accepted by <@${body.member.user.id}>, currently pending unban`;
		message.embeds[0].color = ACCEPTED_COLOUR;
		message.components[0].components = [
			{
				type: ComponentType.Button,
				custom_id: `unban_${userId}_${body.member.user.id}`,
				style: ButtonStyle.Secondary,
				label: "Unban user",
			},
		];

		if (doUserCheck) {
			return editMessage(message);
		} else {
			return editOriginalMessage(apiClient, message);
		}
	},

	getColour() {
		// 'no colour' not included since this is only called when confirming which will always be already rejected
		return [REJECTED_COLOUR];
	},
} satisfies ButtonHandler;
