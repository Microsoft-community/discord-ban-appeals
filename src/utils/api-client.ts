import {
	APIMessage,
	APIMessageComponentInteraction,
	RESTPostAPIChannelMessageJSONBody,
} from "discord-api-types/v10";

export const DISCORD_API_BASE = "https://discord.com/api/v10";
export const MAX_EMBED_FIELD_CHARS = 1024;
export const MAX_EMBED_FOOTER_CHARS = 2048;

export class ApiClient {
	#guildId: string;
	#token: string;
	#cliptokApiEndpoint: string;
	#cliptokApiToken: string;

	constructor(
		discordToken: string,
		cliptokApiEndpoint: string,
		cliptokApiToken: string,
		guildId: string,
	) {
		this.#token = discordToken;
		this.#cliptokApiEndpoint = cliptokApiEndpoint;
		this.#cliptokApiToken = cliptokApiToken;
		this.#guildId = guildId;
	}

	async #discordFetch(endpoint: string, method: string, body: any) {
		const result = await fetch(
			`${DISCORD_API_BASE}${endpoint}`,
			{
				method: method,
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bot ${this.#token}`,
					"User-Agent": ""
				},
				body: JSON.stringify(body),
			},
		);

		const responseBody = await result.json();

		if (!result.ok) {
			console.log(JSON.stringify(await result.json()));
			throw new Error(`Discord request failed: ${endpoint}`);
		}

		return responseBody;
	}

	async sendMessage(
		message: RESTPostAPIChannelMessageJSONBody,
		channel: string,
	) {
		return this.#discordFetch(`/channels/${encodeURIComponent(channel)}/messages`, 'POST', message)
	}

	async getRepliedMessage(
		body: APIMessageComponentInteraction,
	): Promise<APIMessage> {
		if (!body.message.message_reference) {
			throw new Error("Message has no reply");
		}

		const data = await this.#discordFetch(`/channels/${body.message.message_reference.channel_id}/messages/${body.message.message_reference.message_id}`, "GET", null)

		// const res = await fetch(
		// 	DISCORD_API_BASE +
		// 		`/channels/${body.message.message_reference.channel_id}/messages/${body.message.message_reference.message_id}`,
		// 	{
		// 		method: "GET",
		// 		headers: {
		// 			Authorization: `Bot ${this.#token}`,
		// 		},
		// 	},
		// );

		// const data = await res.json();
		// if (!res.ok) {
		// 	console.log(data);
		// 	throw new Error(
		// 		"Something went wrong when attempting to edit original message",
		// 	);
		// }
		return data as APIMessage;
	}

	async editMessage(message: APIMessage) {
		return this.#discordFetch(
			`/channels/${message.channel_id}/messages/${message.id}`,
			"PATCH",
			message
		)

		// const res = await fetch(
		// 	`${DISCORD_API_BASE}/channels/${message.channel_id}/messages/${message.id}`,
		// 	{
		// 		method: "PATCH",
		// 		headers: {
		// 			"Content-Type": "application/json",
		// 			Authorization: `Bot ${this.#token}`,
		// 		},
		// 		body: JSON.stringify(message),
		// 	},
		// );
		// const data = await res.json();

		// if (!res.ok) {
		// 	console.log(data);
		// 	throw new Error(
		// 		"Something went wrong when attempting to edit original message",
		// 	);
		// }
	}

	async getUserInfo() {
		const result = await fetch(`${DISCORD_API_BASE}/users/@me`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${this.#token}`,
			},
		});

		const data = await result.json();

		if (!result.ok) {
			console.log(data);
			throw new Error("Failed to get user information");
		}

		return data;
	}

	async isBlocked(userId: string, blockedUsers: string | null) {
		if (blockedUsers) {
			const blockedArray = blockedUsers
				.replace(/"/g, "")
				.split(",")
				.filter(Boolean);
			if (blockedArray.indexOf(userId) > -1) {
				return true;
			}
		}

		if (this.#cliptokApiToken != null && this.#cliptokApiEndpoint != null) {
			return await this.#getCliptokBlock(userId);
		}

		return false;
	}

	async #getCliptokBlock(userId: string) {
		try {
			const result = await fetch(
				`${this.#cliptokApiEndpoint}/appealBlocks/${encodeURIComponent(userId)}`,
				{
					method: "GET",
					headers: {
						Authorization: this.#cliptokApiToken,
					},
				},
			);

			// redis-exposer returns 200 if it exists
			// anything else, either fall through as allowed or it doesnt exist
			return result.status === 200;
		} catch {
			return false;
		}
	}

	async getBan(userId: string) {
		const result = await this.#callBanApi(userId, "GET");

		if (result.ok) {
			return await result.json();
		} else if (result.status === 404) {
			return null;
		} else {
			console.log(await result.json());
			throw new Error("Failed to get user ban");
		}
	}

	async unbanUser(userId: string, reason: string) {
		const result = await this.#callBanApi(userId, "DELETE", reason);

		if (!result.ok && result.status !== 404) {
			console.log(await result.json());
			throw new Error("Failed to unban user");
		}
	}

	#callBanApi(userId: string, method: "GET" | "DELETE", auditLogReason = "") {
		return fetch(
			`${DISCORD_API_BASE}/guilds/${encodeURIComponent(this.#guildId)}/bans/${encodeURIComponent(userId)}`,
			{
				method: method,
				headers: {
					Authorization: `Bot ${this.#token}`,
					"X-Audit-Log-Reason": auditLogReason,
				},
			},
		);
	}

	async getCliptokBan(userid: string) {
		const result = await fetch(
			`${this.#cliptokApiEndpoint}/bans/${encodeURIComponent(userid)}`,
			{
				method: "GET",
				headers: {
					Authorization: this.#cliptokApiToken,
				},
			},
		);

		if (result.ok) {
			return await result.json();
		} else {
			return null;
		}
	}
}
