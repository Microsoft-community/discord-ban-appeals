import jwt from "jsonwebtoken";

function createJWT(data, duration) {
    const options = {
        issuer: "ban-appeals-backend"
    };

    if(duration) {
        options.expiresIn = duration;
    }

    return jwt.sign(data, process.env.JWT_SECRET, options);
}

function decodeJWT(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}

export { createJWT, decodeJWT };