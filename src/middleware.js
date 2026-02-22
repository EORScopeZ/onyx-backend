// Verify the request carries the correct API secret
function verifySecret(req) {
    const secret = process.env.API_SECRET
    if (!secret) return false
    return (
        req.headers['x-secret']      === secret ||
        req.headers['authorization'] === `Bearer ${secret}` ||
        req.body?.secret             === secret
    )
}

module.exports = { verifySecret }
