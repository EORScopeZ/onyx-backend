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

    try {
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
