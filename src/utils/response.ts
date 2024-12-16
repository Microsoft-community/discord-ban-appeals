import {
	APIInteractionResponseCallbackData,
	APIInteractionResponseChannelMessageWithSource,
	APIInteractionResponseUpdateMessage,
	APIMessage,
	InteractionResponseType,
} from "discord-api-types/v10";
import { ApiClient } from "./api-client";

function reply(
	data: APIInteractionResponseCallbackData,
): APIInteractionResponseChannelMessageWithSource {
	return {
		type: InteractionResponseType.ChannelMessageWithSource,
		data: data,
	};
}

function editMessage(
	newMessage: APIInteractionResponseCallbackData,
): APIInteractionResponseUpdateMessage {
	return {
		type: InteractionResponseType.UpdateMessage,
		data: newMessage,
	};
}

export async function editOriginalMessage(
	apiClient: ApiClient,
	message: APIMessage,
) {
	await apiClient.editMessage(message);
	return null;
}

export { reply, editMessage };
