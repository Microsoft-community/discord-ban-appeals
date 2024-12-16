import {
	APIInteraction,
	APIInteractionResponse,
	APIMessageComponentInteraction,
} from "discord-api-types/v10";
import { ApiClient } from "./api-client";
import { Colour } from "./colour";

export interface ButtonHandler {
	handle: (
		body: APIMessageComponentInteraction,
		apiClient: ApiClient,
		doUserCheck?: boolean,
	) => Promise<APIInteractionResponse | null>;
	getColour?: () => Colour[];
}

export type UserPublic = {
	id: string;
	avatar: string;
	username: string;
	discriminator: string;
};
