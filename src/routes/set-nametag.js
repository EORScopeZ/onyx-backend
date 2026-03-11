const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')
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

    // Handle delete — null out ALL nametag fields so get-nametag returns nothing
    if (req.body.delete === true || req.body.enabled === false) {
        const { error } = await supabase
            .from('users')
            .update({
                nametag_enabled:  false,
                nametag_text:     null,
                nametag_color:    null,
                nametag_effect:   null,
                tag_image:        null,
                icon_image:       null,
                outline_color:    null,
                background_color: null,
            })
            .ilike('roblox_username', roblox_username)

        if (error) { console.error(error); return res.status(500).json({ error: 'Server error.' }) }
        return res.json({ ok: true, deleted: true })
    }

    // Bot sends config nested under req.body.config
    const cfg = req.body.config || req.body

    const updates = {
        nametag_enabled:  true,
        nametag_text:     (cfg.nametag_text || cfg.text || cfg.name_text || null),
        nametag_color:    validHex(cfg.nametag_color || cfg.color || cfg.name_color) || '#8b7fff',
        nametag_effect:   (cfg.glitch_anim === true || cfg.glitch_anim === 'true') ? 'glitch' : (cfg.nametag_effect || cfg.effect || null),
        tag_image:        cfg.image_url || null,
        icon_image:       cfg.icon_image || null,
        outline_color:    validHex(cfg.outline_color || cfg.glow_color) || '#8b7fff',
        background_color: validHex(cfg.tag_color || cfg.backgroundColor) || '#0f0f0f',
    }

    if (updates.nametag_text) updates.nametag_text = updates.nametag_text.slice(0, 64)

    try {
        const { error } = await supabase
            .from('users')
            .update(updates)
            .ilike('roblox_username', roblox_username)

        if (error) throw error
        return res.json({ ok: true, ...updates })

    } catch (err) {
        console.error('[set-nametag]', err)
        return res.status(500).json({ error: 'Server error.' })
    }
})

module.exports = router
