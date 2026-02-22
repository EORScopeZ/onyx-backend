const express    = require('express')
const router     = express.Router()
const supabase   = require('../services/supabase')
const { verifySecret } = require('../middleware')

const HEX = /^#[0-9a-fA-F]{6}$/

router.post('/', async (req, res) => {
    if (!verifySecret(req))
        return res.status(403).json({ error: 'Forbidden.' })

    // Bot sends roblox_user, other callers may send roblox_username or username
    const roblox_username = (req.body.roblox_username || req.body.username || req.body.roblox_user || '').toLowerCase().trim()
    if (!roblox_username)
        return res.status(400).json({ error: 'roblox_username required.' })

    // Handle disable / delete
    if (req.body.delete === true || req.body.enabled === false) {
        const { error } = await supabase
            .from('users')
            .update({ nametag_enabled: false })
            .eq('roblox_username', roblox_username)

        if (error) { console.error(error); return res.status(500).json({ error: 'Server error.' }) }
        return res.json({ ok: true, nametag_enabled: false })
    }

    // Bot sends config object with its own field names — support both naming conventions
    const cfg = req.body.config || req.body

    const text  = (cfg.nametag_text  || cfg.text  || cfg.name_text  || '').slice(0, 64)
    const color = (cfg.nametag_color || cfg.color  || cfg.name_color || '#8b7fff').trim()
    const effect = cfg.nametag_effect || cfg.effect || cfg.glitch_anim || null

    if (color && !HEX.test(color))
        return res.status(400).json({ error: 'Invalid color. Use #rrggbb format.' })

    try {
        const { error } = await supabase
            .from('users')
            .update({
                nametag_text:    text    || null,
                nametag_color:   color   || '#8b7fff',
                nametag_effect:  effect  || null,
                nametag_enabled: true,
            })
            .eq('roblox_username', roblox_username)

        if (error) throw error
        return res.json({ ok: true, nametag_enabled: true, nametag_text: text, nametag_color: color, nametag_effect: effect })

    } catch (err) {
        console.error('[set-nametag]', err)
        return res.status(500).json({ error: 'Server error.' })
    }
})

module.exports = router
