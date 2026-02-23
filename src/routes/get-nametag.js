const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')

router.get('/:username', async (req, res) => {
    const roblox_username = (req.params.username || '').toLowerCase().trim()
    if (!roblox_username) return res.json({ found: false })

    try {
        const { data: user } = await supabase
            .from('users')
            .select('*')
            .ilike('roblox_username', roblox_username)
            .order('nametag_text', { ascending: false, nullsFirst: false })
            .order('last_heartbeat', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (!user)
            return res.json({ found: false })

        // Debug: log exactly what's stored for this user's images
        console.log(`[get-nametag] ${roblox_username} → tag_image=${user.tag_image}, icon_image=${user.icon_image}, heartbeat=${user.last_heartbeat}`)

        const isActive = user.last_heartbeat && (new Date() - new Date(user.last_heartbeat)) < 120000

        return res.json({
            found: true,
            active: isActive,
            config: {
                name_text: user.nametag_text || "Onyx User",
                name_color: user.nametag_color || "#ffffff",
                tag_color: user.background_color || "#0f0f0f",
                glow_color: user.outline_color || "#8b7fff",
                outline_color: user.outline_color || "#8b7fff",
                image_url: user.tag_image,
                icon_image: user.icon_image,
                glitch_anim: user.nametag_effect === "glitch" ? true : false,
            }
        })

    } catch (err) {
        console.error('[get-nametag]', err)
        return res.json({ found: false })
    }
})

module.exports = router
