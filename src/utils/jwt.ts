import { sign, verify } from "hono/jwt";

function createJWT(data: any, duration: number, secret: string) {
	const now = Math.floor(Date.now() / 1000);
	const jwtData = {
		...data,
		iat: now,
		...(duration ? { exp: now + duration } : {}),
		iss: "ban-appeals-backend",
	};

	return sign(jwtData, secret);
}

function decodeJWT(token: string, secret: string) {
	return verify(token, secret);
}

export { createJWT, decodeJWT };
