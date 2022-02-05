"use strict";

export default async (req, res) => {
	if (!req.headers.host) {
		res.status(400);
	}

	const redirectURI = `https://${req.headers.host}/api/oauth-callback`;
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