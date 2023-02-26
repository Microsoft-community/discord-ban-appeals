import crypto from "crypto";

export default async (req, res) => {
	if(req.method !== "GET") {
		res.status(405).send("Invalid method");
		return;
	}

	const redirectURI = `https://${req.headers["x-forwarded-host"]}/api/oauth-callback`;
	const state = crypto.randomBytes(25).toString("hex");
	const params = {
		client_id: process.env.DISCORD_CLIENT_ID,
		redirect_uri: redirectURI,
		response_type: "code",
		scope: "identify",
		prompt: "none",
		state: state
	}
	if (req.query.state) {
		params.state = req.query.state;
	}
	const authURL = `https://discord.com/api/oauth2/authorize?${new URLSearchParams(params).toString()}`;

	res.setHeader("Set-Cookie", `__Secure-CSRFState=${state}; Domain=${req.headers["x-forwarded-host"]}; Path=/api/oauth-callback; Secure; HttpOnly; SameSite=Lax`).redirect(303, authURL);
}