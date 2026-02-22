const express    = require('express')
const router     = express.Router()
const supabase   = require('../services/supabase')
const { verifySecret } = require('../middleware')

// Handles both POST /api/blacklist and POST /api/unblacklist
router.post('/', async (req, res) => {
    if (!verifySecret(req))
        return res.status(403).json({ error: 'Forbidden.' })

    // req.path is always '/' inside a subrouter — use originalUrl instead
    const isUnblacklist   = req.originalUrl.includes('unblacklist') || req.body.action === 'remove'
    const roblox_username = (req.body.roblox_username || req.body.username || req.body.roblox_user || '').toLowerCase().trim()
    const hwid            = (req.body.hwid || '').trim()

    if (!roblox_username && !hwid)
        return res.status(400).json({ error: 'roblox_username or hwid required.' })

    try {
        let query = supabase.from('users').update({ blacklisted: !isUnblacklist })

        if (roblox_username) {
            query = query.eq('roblox_username', roblox_username)
        } else {
            query = query.eq('hwid', hwid)
        }

        const { error } = await query
        if (error) throw error

        const action = isUnblacklist ? 'unblacklisted' : 'blacklisted'
        return res.json({ success: true, action, roblox_username: roblox_username || null, hwid: hwid || null })

    } catch (err) {
        console.error('[blacklist]', err)
        return res.status(500).json({ error: 'Server error.' })
    }
})

module.exports = router
