import {
	ButtonStyle,
	ComponentType,
	MessageFlags,
} from "discord-api-types/v10";
import {
	ACCEPTED_COLOUR,
	REJECTED_COLOUR,
	UNBANNED_COLOUR,
} from "../utils/colour.js";
import { editMessage, editOriginalMessage, reply } from "../utils/response.js";
import { ButtonHandler } from "../utils/types.js";

export default {
	async handle(body, apiClient, doUserCheck = true) {
		const message = body.message;
		const userId = body.data.custom_id.split("_")[1];

		if (!body.member) throw new Error("how");

		if (
			doUserCheck &&
			message.embeds[0].color === REJECTED_COLOUR &&
			message.embeds[0].fields?.[4]
		) {
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

		if (
			doUserCheck &&
			body.data.custom_id.split("_")[2] &&
			body.data.custom_id.split("_")[2] !== body.member.user.id
		) {
			return reply({
				content: `Someone else accepted this appeal, are you sure you want to unban them?`,
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
		} else {
			try {
				await apiClient.unbanUser(
					userId,
					`[Unban by ${body.member.user.username}#${body.member.user.discriminator}] Ban appeal accepted.`,
				);
			} catch (e) {
				console.error(e);
				return reply({
					content: "An error occurred when attempting to unban user.",
					flags: MessageFlags.Ephemeral,
				});
			}

			message.content = `Appeal from <@${userId}> (${userId}) accepted by <@${body.member.user.id}> and user unbanned, currently in progress`;
			message.embeds[0].color = UNBANNED_COLOUR;
			message.components![0].components = [
				{
					type: ComponentType.Button,
					custom_id: `complete_${userId}_${body.member.user.id}`,
					style: ButtonStyle.Secondary,
					label: "Mark as complete",
				},
			];
		}

		if (doUserCheck) {
			return editMessage(message);
		} else {
			return editOriginalMessage(apiClient, message);
		}
	},

	getColour() {
		return [ACCEPTED_COLOUR, REJECTED_COLOUR];
	},
} satisfies ButtonHandler;
