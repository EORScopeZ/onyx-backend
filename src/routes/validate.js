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
        if (!user)        return res.json({ valid: false, message: 'User not found. Ask to be whitelisted.' })
        if (user.blacklisted)  return res.json({ valid: false, message: 'You are blacklisted.' })
        if (!user.whitelisted) return res.json({ valid: false, message: 'You are not whitelisted.' })

        // ── 2. HWID binding ──────────────────────────────────────────────────
        if (!user.hwid) {
            // First time — bind this HWID to the account
            await supabase.from('users').update({ hwid }).eq('id', user.id)
        } else if (user.hwid !== hwid) {
            return res.json({ valid: false, message: 'HWID mismatch. Contact support.' })
        }

        // Build nametag payload (null if disabled)
        const nametag = user.nametag_enabled
            ? { text: user.nametag_text, color: user.nametag_color, effect: user.nametag_effect }
            : null

        // ── 3. Permanent key ─────────────────────────────────────────────────
        if (user.has_permanent_key && key && user.permanent_key === key) {
            return res.json({ valid: true, type: 'permanent', nametag })
        }

        // ── 4. Global / temp key ─────────────────────────────────────────────
        if (!key)
            return res.json({ valid: false, message: 'Key required.' })

        const { data: globalKey } = await supabase
            .from('system_settings')
            .select('*')
            .eq('type', 'global_key')
            .maybeSingle()

        if (!globalKey)
            return res.json({ valid: false, message: 'No active global key. Try again later.' })

        if (globalKey.expires_at && new Date(globalKey.expires_at) < new Date())
            return res.json({ valid: false, message: 'Global key has expired.' })

        if (globalKey.value !== key)
            return res.json({ valid: false, message: 'Invalid key.' })

        return res.json({ valid: true, type: 'temporary', nametag })

    } catch (err) {
        console.error('[validate]', err)
        return res.json({ valid: false, message: 'Server error.' })
    }
})

module.exports = router
