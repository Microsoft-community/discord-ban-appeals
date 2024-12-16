import { verifyKey } from "discord-interactions";
import { Hono } from "hono";
import { parseCookies } from "./utils/cookie";
import {
	ApiClient,
	MAX_EMBED_FIELD_CHARS,
	MAX_EMBED_FOOTER_CHARS,
} from "./utils/api-client";
import {
	APIInteraction,
	APIUser,
	ComponentType,
	InteractionType,
	MessageFlags,
	RESTPostAPIChannelMessageJSONBody,
} from "discord-api-types/v10";
import { createJWT, decodeJWT } from "./utils/jwt";
import { UserPublic } from "./utils/types";
import accept from "./buttons/accept";
import complete from "./buttons/complete";
import confirm from "./buttons/confirm";
import reject from "./buttons/reject";
import unban from "./buttons/unban";
import { reply } from "./utils/response";

type Env = {
	DISCORD_CLIENT_ID: string;
	DISCORD_CLIENT_SECRET: string;
	DISCORD_BOT_TOKEN: string;
	DISCORD_PUBLIC_KEY: string;
	CLIPTOK_API_ENDPOINT: string;
	CLIPTOK_API_TOKEN: string;
	GUILD_ID: string;
	APPEALS_CHANNEL: string;
	BLOCKED_USERS: string;
	JWT_SECRET: string;
	SKIP_BAN_CHECK: boolean;
	DISABLE_UNBAN_LINK: boolean;
};

const app = new Hono<{ Bindings: Env }>();

app.get("/api/oauth", (c) => {
	const redirectURI = `https://${c.req.header("x-forwarded-host")}/api/oauth-callback`;

	const array = new Uint8Array(25);
	crypto.getRandomValues(array);
	let state = "";
	for (let i of array) {
		state += i.toString(16).padStart(2, "0");
	}

	const params = {
		client_id: c.env.DISCORD_CLIENT_ID,
		redirect_uri: redirectURI,
		response_type: "code",
		scope: "identify",
		prompt: "none",
		state: state,
	};

	const authURL = `https://discord.com/api/oauth2/authorize?${new URLSearchParams(params).toString()}`;

	c.header(
		"Set-Cookie",
		`__Secure-CSRFState=${state}; Domain=${c.req.header("x-forwarded-host") ?? c.req.header("Host")}; Path=/api/oauth-callback; Secure; HttpOnly; SameSite=Lax`,
	);
	return c.redirect(authURL, 303);
});

app.get("/api/oauth-callback", async (c) => {
	const code = c.req.query("code");
	const state = c.req.query("state");
	const cookieHeader = c.req.header("Cookie");
	if (!code || !state || !cookieHeader)
		return c.text("Incomplete or malformed request", 400);

	const cookies = parseCookies(cookieHeader);
	if (
		!(cookies["__Secure-CSRFState"] && cookies["__Secure-CSRFState"] === state)
	)
		return c.text("Unauthorized", 403);

	try {
		const result = await fetch("https://discord.com/api/oauth2/token", {
			method: "POST",
			body: new URLSearchParams({
				client_id: c.env.DISCORD_CLIENT_ID,
				client_secret: c.env.DISCORD_CLIENT_SECRET,
				grant_type: "authorization_code",
				code: code,
				redirect_uri: new URL(
					"/api/oauth-callback",
					`https://${c.req.header("x-forwarded-host")}`,
				).toString(),
				scope: "identify",
			}),
		});
		const data = (await result.json()) as any;

		if (!result.ok) {
			console.log(data);
			throw new Error("Failed to get user access token");
		}

		const apiClient = new ApiClient(
			data["access_token"]!,
			c.env.CLIPTOK_API_ENDPOINT,
			c.env.CLIPTOK_API_TOKEN,
			c.env.GUILD_ID,
		);

		const user = (await apiClient.getUserInfo()) as APIUser;
		if (await apiClient.isBlocked(user.id, c.env.BLOCKED_USERS)) {
			c.redirect(
				`/error.html?msg=${encodeURIComponent("Your ability to submit ban appeals has been revoked due to abuse or spam.")}`,
				303,
			);
		}

		if (!c.env.SKIP_BAN_CHECK) {
			const ban = await apiClient.getBan(user.id);

			if (!ban) {
				c.redirect("/error.html", 303);
			}
		}

		const userPublic = {
			id: user.id,
			avatar: user.avatar,
			username: user.username,
			discriminator: user.discriminator,
		};
		let url = `/form.html?token=${encodeURIComponent(await createJWT(userPublic, data.expires_in, c.env.JWT_SECRET))}`;
		if (c.req.query("state")) {
			url += `&state=${encodeURIComponent(c.req.query("state")!)}`;
		}

		return c.redirect(url, 303);
	} catch (e) {
		console.error(e);
		return c.text(
			"An internal error occurred, please inform this site's owner about this incident!",
			500,
		);
	}
});

app.post("/api/submit-appeal", async (c) => {
	const body = await c.req.text();
	const params = new URLSearchParams(body);
	const payload = {
		banReason: params.get("banReason") || undefined,
		appealText: params.get("appealText") || undefined,
		futureActions: params.get("futureActions") || undefined,
		token: params.get("token") || undefined,
	};

	if (
		payload.banReason !== undefined &&
		payload.appealText !== undefined &&
		payload.futureActions !== undefined &&
		payload.token !== undefined
	) {
		const userInfo = (await decodeJWT(
			payload.token,
			c.env.JWT_SECRET,
		)) as UserPublic;
		const apiClient = new ApiClient(
			c.env.DISCORD_BOT_TOKEN,
			c.env.CLIPTOK_API_ENDPOINT,
			c.env.CLIPTOK_API_TOKEN,
			c.env.GUILD_ID,
		);
		if (await apiClient.isBlocked(userInfo.id, c.env.BLOCKED_USERS)) {
			return c.redirect(
				`/error.html?msg=${encodeURIComponent("Your ability to submit ban appeals has been revoked due to abuse or spam.")}`,
				303,
			);
		}

		let timestamp = new Date();
		let strTimestamp: string = null!;

		if (c.env.CLIPTOK_API_TOKEN != null && c.env.CLIPTOK_API_ENDPOINT != null) {
			const cliptokBanData = (await apiClient.getCliptokBan(userInfo.id)) as any;
			try {
				// handle things being missing, strTimestamp stays as null
				if (
					cliptokBanData != null &&
					cliptokBanData.data != null &&
					cliptokBanData.data.actionTime != null
				) {
					timestamp = new Date();
					timestamp.setTime(Date.parse(cliptokBanData.data.actionTime));
					strTimestamp = timestamp.toISOString();
				}
			} catch (e) {
				// the data from cliptok is just an extra, if it errors then completely ignore it instead of hard failing.
				// in this case strTimestamp would stay as null
				// ideally this shouldn't happen because of all the null checks above, but we still don't want appeals failing.
				console.log(e);
			}
		} else {
			// if the env vars aren't there, keep behaviour consistent with previous versions
			strTimestamp = new Date().toISOString();
		}

		const message: RESTPostAPIChannelMessageJSONBody = {
			content: `New appeal submitted by <@${userInfo.id}>: (${userInfo.id})`,
			embeds: [
				{
					timestamp: strTimestamp,
					fields: [
						{
							name: "Submitter",
							value: `<@${userInfo.id}> (${userInfo.username}${userInfo.discriminator !== "0" ? "#" + userInfo.discriminator : ""})`,
						},
						{
							name: "Why were you banned?",
							value: payload.banReason.slice(0, MAX_EMBED_FIELD_CHARS),
						},
						{
							name: "Why do you feel you should be unbanned?",
							value: payload.appealText.slice(0, MAX_EMBED_FIELD_CHARS),
						},
						{
							name: "What will you do to avoid being banned in the future?",
							value: payload.futureActions.slice(0, MAX_EMBED_FIELD_CHARS),
						},
					],
				},
			],
		};

		try {
			const ban = (await apiClient.getBan(userInfo.id)) as any;
			if (ban && ban.reason) {
				message.embeds![0].footer = {
					text: `Original ban reason: ${ban.reason}`.slice(
						0,
						MAX_EMBED_FOOTER_CHARS,
					),
				};
			}
		} catch (e) {
			console.log(e);
		}

		if (!c.env.DISABLE_UNBAN_LINK) {
			message.components = [
				{
					type: 1,
					components: [
						{
							type: 2,
							style: 3,
							label: "Accept appeal and unban",
							custom_id: `unban_${userInfo.id}`,
						},
						{
							type: 2,
							style: 2,
							label: "Accept appeal",
							custom_id: `accept_${userInfo.id}`,
						},
						{
							type: 2,
							style: 4,
							label: "Reject appeal",
							custom_id: `reject_${userInfo.id}`,
						},
					],
				},
			];
		}

		await apiClient.sendMessage(message, c.env.APPEALS_CHANNEL);
		return c.redirect("/success.html", 303);
	}
});

app.post("/api/interactions", async (c) => {
	const signature = c.req.header("X-Signature-Ed25519");
	const timestamp = c.req.header("X-Signature-Timestamp");
	console.log(c.env.DISCORD_PUBLIC_KEY);
	console.log(timestamp);

	if (!signature || !timestamp) return c.text("Bad Request", 400);
	const rawBody = await c.req.text();
	const body = JSON.parse(rawBody) as APIInteraction;
	console.log(body.type);

	const valid = await verifyKey(
		rawBody,
		signature ?? "",
		timestamp ?? "",
		c.env.DISCORD_PUBLIC_KEY,
	);
	if (!valid) return c.text("Bad Signature", 401);

	const apiClient = new ApiClient(
		c.env.DISCORD_BOT_TOKEN,
		c.env.CLIPTOK_API_ENDPOINT,
		c.env.CLIPTOK_API_TOKEN,
		c.env.GUILD_ID,
	);

	switch (body.type) {
		case InteractionType.Ping: {
			return c.json({
				type: 1,
			});
		}
		case InteractionType.MessageComponent: {
			if (body.data.component_type === ComponentType.Button) {
				const state = body.data.custom_id.split("_")[0];
				let response;
				switch (state) {
					case "accept": {
						response = accept.handle(body, apiClient, true);
						break;
					}
					case "reject": {
						response = reject.handle(body, apiClient);
						break;
					}
					case "confirm": {
						response = confirm.handle(body, apiClient);
						break;
					}
					case "complete": {
						response = complete.handle(body, apiClient, true);
						break;
					}
					case "unban": {
						response = unban.handle(body, apiClient, true);
						break;
					}
				}

				return c.json(await response, 200);
			}
		}

		default: {
			return c.json(
				reply({
					content: "This interaction is not supported!",
					flags: MessageFlags.Ephemeral,
				}),
			);
		}
	}
});

export default app;
