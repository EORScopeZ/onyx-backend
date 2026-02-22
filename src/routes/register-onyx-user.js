/**
 * POST /api/register-onyx-user
 * Called by Roblox as a heartbeat to signal a user is in-game.
 * Returns the full nametag list so the client can update all tags at once.
 */
const express    = require('express')
const router     = express.Router()
const supabase   = require('../services/supabase')

router.post('/', async (req, res) => {
    const roblox_username = (req.body.roblox_user || req.body.username || '').toLowerCase().trim()
    if (!roblox_username) return res.json({ ok: false, nametags: [] })

    try {
        // Fetch all nametag-enabled whitelisted users in one query
        const { data, error } = await supabase
            .from('users')
            .select('roblox_username, nametag_text, nametag_color, nametag_effect')
            .eq('nametag_enabled', true)
            .eq('whitelisted', true)

        if (error) throw error

        const nametags = data.map(u => ({
            roblox_user: u.roblox_username,
            text:        u.nametag_text,
            color:       u.nametag_color,
            effect:      u.nametag_effect,
        }))

        return res.json({ ok: true, nametags })

    } catch (err) {
        console.error('[register-onyx-user]', err)
        return res.json({ ok: false, nametags: [] })
    }
})

module.exports = router
