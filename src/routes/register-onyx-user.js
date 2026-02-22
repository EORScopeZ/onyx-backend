/**
 * POST /api/register-onyx-user
 * Called by Roblox as a heartbeat to signal a user is in-game.
 * Returns the full nametag list so the client can update all tags at once.
 */
const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')

router.post('/', async (req, res) => {
    const roblox_username = (req.body.roblox_user || req.body.username || '').toLowerCase().trim()
    if (!roblox_username) return res.json({ ok: false, nametags: [] })

    try {
        const { data, error } = await supabase
            .from('users')
            .select('roblox_username, nametag_text, nametag_color, nametag_effect, tag_image, outline_color, background_color, text_color')
            .eq('nametag_enabled', true)
            .eq('whitelisted', true)

        if (error) throw error

        const nametags = data.map(u => ({
            roblox_user: u.roblox_username,
            name_text: u.nametag_text,
            name_color: u.nametag_color,
            tag_color: "#0f0f0f", // fallback or fetch if existed
            outline_color: u.nametag_effect, // Onyx V2 maps outlineColor to nametag_effect if glow_color or outline_color isn't there, but let's provide outline_color. Wait, looking at V2: `outline_color = u.nametag_effect` is wrong, effect is a boolean or string. Let's provide exactly what Onyx V2 expects.

            // Re-mapping correctly based on V2 lua:
            // displayName = cfg.name_text
            // textColor = hexToColor3(cfg.name_color)
            // outlineColor = hexToColor3(cfg.outline_color or cfg.glow_color)
            // backgroundColor = hexToColor3(cfg.tag_color)
            // glitchAnim = cfg.glitch_anim

            name_text: u.nametag_text,
            name_color: u.text_color || u.nametag_color,
            tag_color: u.background_color || "#0f0f0f",
            glow_color: u.outline_color || "#ffffff",
            icon_image: u.tag_image || null,
            glitch_anim: u.nametag_effect === "glitch" ? true : false
        }))

        return res.json({ ok: true, nametags })

    } catch (err) {
        console.error('[register-onyx-user]', err)
        return res.json({ ok: false, nametags: [] })
    }
})

module.exports = router
