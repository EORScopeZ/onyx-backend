const express    = require('express')
const router     = express.Router()
const supabase   = require('../services/supabase')
const { verifySecret } = require('../middleware')

// GET /status or GET /status/:key — bot calls both forms
router.get('/', handler)
router.get('/:key', handler)

async function handler(req, res) {
    if (!verifySecret(req))
        return res.status(403).json({ error: 'Forbidden.' })

    const keyParam = req.params.key

    try {
        // ── If a specific key was passed, look it up in issued_keys ──────────
        if (keyParam) {
            const { data: issued, error } = await supabase
                .from('issued_keys')
                .select('*')
                .eq('key', keyParam.trim())
                .maybeSingle()

            if (error) throw error

            if (!issued)
                return res.json({ found: false, message: 'Key not found.' })

            const expired = new Date(issued.expires_at) < new Date()

            return res.json({
                found:           true,
                key:             issued.key,
                expires_at:      issued.expires_at,
                expired,
                hwid_bound:      !!issued.hwid,
                roblox_username: issued.roblox_username || null,
            })
        }

        // ── No key passed — return global key status ──────────────────────────
        const { data: globalKey } = await supabase
            .from('system_settings')
            .select('*')
            .eq('type', 'global_key')
            .maybeSingle()

        if (!globalKey)
            return res.json({ found: false, message: 'No global key set.' })

        const expired = globalKey.expires_at
            ? new Date(globalKey.expires_at) < new Date()
            : false

        return res.json({
            found:      true,
            key:        globalKey.value,
            expires_at: globalKey.expires_at,
            expired,
        })

    } catch (err) {
        console.error('[status]', err)
        return res.status(500).json({ error: 'Server error.' })
    }
}

module.exports = router
