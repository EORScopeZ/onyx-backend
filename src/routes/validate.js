const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')

router.post('/', async (req, res) => {
    const { username, key, hwid, secret } = req.body

    if (secret !== process.env.API_SECRET)
        return res.json({ valid: false })

    try {
        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('roblox_username', username)
            .single()

        if (!user) return res.json({ valid: false })
        if (user.blacklisted) return res.json({ valid: false })
        if (!user.whitelisted) return res.json({ valid: false })

        // Bind HWID
        if (!user.hwid) {
            await supabase
                .from('users')
                .update({ hwid })
                .eq('id', user.id)
        } else if (user.hwid !== hwid) {
            return res.json({ valid: false })
        }

        // Permanent key
        if (user.has_permanent_key && user.permanent_key === key) {
            return res.json({
                valid: true,
                type: "permanent",
                nametag: user.nametag_enabled ? {
                    text: user.nametag_text,
                    color: user.nametag_color,
                    effect: user.nametag_effect
                } : null
            })
        }

        // Global key
        const { data: globalKey } = await supabase
            .from('system_settings')
            .select('*')
            .eq('type', 'global_key')
            .single()

        if (!globalKey) return res.json({ valid: false })

        if (new Date(globalKey.expires_at) < new Date())
            return res.json({ valid: false })

        if (globalKey.value === key) {
            return res.json({
                valid: true,
                type: "temporary",
                nametag: user.nametag_enabled ? {
                    text: user.nametag_text,
                    color: user.nametag_color,
                    effect: user.nametag_effect
                } : null
            })
        }

        return res.json({ valid: false })

    } catch (err) {
        console.error(err)
        return res.json({ valid: false })
    }
})

module.exports = router