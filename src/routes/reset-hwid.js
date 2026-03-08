const express  = require('express')
const router   = express.Router()
const supabase = require('../services/supabase')
const { verifySecret } = require('../middleware')

// POST /reset-hwid — clears the HWID for a whitelisted user
// Use when a user changes PC, reinstalls Windows, or switches executor
router.post('/', async (req, res) => {
    if (!verifySecret(req))
        return res.status(403).json({ error: 'Forbidden.' })

    const roblox_username = (req.body.roblox_username || req.body.username || req.body.roblox_user || '').toLowerCase().trim()

    if (!roblox_username)
        return res.status(400).json({ error: 'roblox_username required.' })

    try {
        const { error } = await supabase
            .from('users')
            .update({ hwid: null })
            .ilike('roblox_username', roblox_username)

        if (error) throw error

        return res.json({ success: true, message: `HWID cleared for ${roblox_username}` })

    } catch (err) {
        console.error('[reset-hwid]', err)
        return res.status(500).json({ error: 'Server error.' })
    }
})

module.exports = router
