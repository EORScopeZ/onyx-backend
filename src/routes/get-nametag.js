const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')

router.get('/:username', async (req, res) => {
    const roblox_username = (req.params.username || '').toLowerCase().trim()
    if (!roblox_username) return res.json({ found: false })

    try {
        const { data: user } = await supabase
            .from('users')
            .select('nametag_enabled, nametag_text, nametag_color, nametag_effect, tag_image, outline_color, background_color, text_color')
            .eq('roblox_username', roblox_username)
            .maybeSingle()

        if (!user || !user.nametag_enabled)
            return res.json({ found: false })

        return res.json({
            found: true,
            active: true, // Mocked to force rendering, as active state is currently not tracked in the db heartbeat
            config: {
                name_text: user.nametag_text,
                name_color: user.text_color || user.nametag_color,
                tag_color: user.background_color || "#0f0f0f",
                glow_color: user.outline_color || "#ffffff",
                icon_image: user.tag_image || null,
                glitch_anim: user.nametag_effect === "glitch" ? true : false,
            }
        })

    } catch (err) {
        console.error('[get-nametag]', err)
        return res.json({ found: false })
    }
})

module.exports = router
