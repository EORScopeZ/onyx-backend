const express  = require('express')
const router   = express.Router()
const supabase = require('../services/supabase')

router.post('/', async (req, res) => {
    const { username, key, hwid, secret } = req.body

    // Roblox scripts must pass the API secret
    if (secret !== process.env.API_SECRET)
        return res.json({ valid: false, message: 'Forbidden.' })

    if (!username || !hwid)
        return res.json({ valid: false, message: 'Missing username or hwid.' })

    try {
        // ── 1. Fetch user ────────────────────────────────────────────────────
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('roblox_username', username.toLowerCase().trim())
            .maybeSingle()

        if (error) throw error
        if (!user)          return res.json({ valid: false, message: 'User not found. Ask to be whitelisted.' })
        if (user.blacklisted)   return res.json({ valid: false, message: 'You are blacklisted.' })
        if (!user.whitelisted)  return res.json({ valid: false, message: 'You are not whitelisted.' })

        // ── 2. HWID binding ──────────────────────────────────────────────────
        if (!user.hwid) {
            await supabase.from('users').update({ hwid }).eq('id', user.id)
        } else if (user.hwid !== hwid) {
            return res.json({ valid: false, message: 'HWID mismatch. Contact support.' })
        }

        // Build nametag payload
        const nametag = user.nametag_enabled
            ? { text: user.nametag_text, color: user.nametag_color, effect: user.nametag_effect }
            : null

        // ── 3. Whitelisted users skip the key entirely ───────────────────────
        return res.json({ valid: true, type: 'whitelisted', nametag })

    } catch (err) {
        console.error('[validate]', err)
        return res.json({ valid: false, message: 'Server error.' })
    }
})

module.exports = router
