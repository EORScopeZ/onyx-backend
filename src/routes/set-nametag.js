const express    = require('express')
const router     = express.Router()
const supabase   = require('../services/supabase')
const { verifySecret } = require('../middleware')

const HEX = /^#[0-9a-fA-F]{6}$/

function validHex(c) {
    if (!c) return null
    c = c.trim()
    if (!c.startsWith('#')) c = '#' + c
    return HEX.test(c) ? c : null
}

router.post('/', async (req, res) => {
    if (!verifySecret(req))
        return res.status(403).json({ error: 'Forbidden.' })

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

    // Bot sends config nested under req.body.config
    const cfg = req.body.config || req.body

    // Map all possible field name variants from the bot
    const updates = {
        nametag_enabled:       true,
        nametag_text:          (cfg.nametag_text  || cfg.text  || cfg.name_text  || null),
        nametag_color:         validHex(cfg.nametag_color || cfg.color || cfg.name_color) || '#8b7fff',
        nametag_effect:        cfg.nametag_effect || cfg.effect || null,
        nametag_tag_color:     validHex(cfg.tag_color)     || '#0f0f0f',
        nametag_glow_color:    validHex(cfg.glow_color)    || '#8b7fff',
        nametag_outline_color: validHex(cfg.outline_color) || '#8b7fff',
        nametag_image_url:     cfg.image_url  || null,
        nametag_icon_image:    cfg.icon_image || null,
        nametag_glitch_anim:   cfg.glitch_anim === true || cfg.glitch_anim === 'true' || false,
    }

    // Trim nametag text to 64 chars
    if (updates.nametag_text) updates.nametag_text = updates.nametag_text.slice(0, 64)

    try {
        const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('roblox_username', roblox_username)

        if (error) throw error
        return res.json({ ok: true, ...updates })

    } catch (err) {
        console.error('[set-nametag]', err)
        return res.status(500).json({ error: 'Server error.' })
    }
})

module.exports = router
