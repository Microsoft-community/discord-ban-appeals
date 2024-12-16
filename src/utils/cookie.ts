export function parseCookies(str: string) {
	return str
		.split(";")
		.map((v) => v.split("="))
		.reduce((acc: Record<string, string>, v) => {
			acc[v[0]] = v[1];
			return acc;
		}, {});
}
