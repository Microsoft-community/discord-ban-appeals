"use strict";

export default async (req, res) => {
	if(req.method !== "GET") {
		res.status(405).send("Invalid method");
		return;
	}

	if (!req.headers.host) {
		res.status(400);
		return;
	}

	console.log(req.headers)

	const redirectURI = `https://${req.headers["x-forwarded-host"]}/api/oauth-callback`;
	const params = {
		client_id: process.env.DISCORD_CLIENT_ID,
		redirect_uri: redirectURI,
		response_type: "code",
		scope: "identify",
		prompt: "none"
	}
	if (req.query.state) {
		params.state = req.query.state;
	}
	const authURL = `https://discord.com/api/oauth2/authorize?${new URLSearchParams(params).toString()}`;

	res.redirect(303, authURL);
}