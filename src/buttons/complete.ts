import { ButtonStyle, ComponentType, MessageFlags } from "discord-api-types/v10";
import { COMPLETED_COLOUR, UNBANNED_COLOUR } from "../utils/colour.js";
import { editMessage, editOriginalMessage, reply } from "../utils/response.js";
import { ButtonHandler } from "../utils/types.js";

export default {
	async handle(body, apiClient, doUserCheck = true) {
		const message = body.message;
		const userId = body.data.custom_id.split("_")[1];

		if (!body.member || !message.components || !message.embeds[0].fields)
			throw new Error("how");

		if (
			doUserCheck &&
			body.data.custom_id.split("_")[2] !== body.member.user.id
		) {
			return reply({
				content:
					"Someone else unbanned this user, are you sure you want to mark this as complete?",
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

		message.content = `Appeal from <@${userId}> (${userId}) accepted, user has been notified`;
		message.embeds[0].color = COMPLETED_COLOUR;
		message.components = [];
		if (doUserCheck) {
			return editMessage(message);
		} else {
			return editOriginalMessage(apiClient, message);
		}
	},

	getColour() {
		return [UNBANNED_COLOUR];
	},
} satisfies ButtonHandler;
