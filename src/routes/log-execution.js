const express  = require('express')
const router   = express.Router()
const supabase = require('../services/supabase')

router.post('/', async (req, res) => {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
             || req.socket?.remoteAddress
             || 'unknown'

    const roblox_username = (req.body.username || req.body.roblox_user || 'Unknown').trim()
    const event           = req.body.event || req.body.type || 'execution'

    // Always respond immediately so the Lua script isn't blocked
    res.json({ ok: true })

    // ── Save to Supabase ──────────────────────────────────────────────────────
    try {
        await supabase.from('logs').insert({ roblox_username, event, ip })
    } catch (err) {
        console.error('[log-execution] supabase insert failed:', err.message)
    }

    // ── Forward to Discord bot ────────────────────────────────────────────────
    // BOT_URL must be set in Railway env vars to your bot's Railway URL.
    // The bot listens on LOG_PORT (default 3001) for /log-execution POST requests.
    const botUrl = process.env.BOT_URL
    if (!botUrl) {
        console.warn('[log-execution] BOT_URL not set — cannot forward to Discord bot. Set BOT_URL in Railway env vars.')
        return
    }

    try {
        const payload = { ...req.body, ip }
        const res2 = await fetch(`${botUrl.replace(/\/$/, '')}/log-execution`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
        })
        if (!res2.ok) {
            console.error(`[log-execution] bot forward returned ${res2.status}`)
        }
    } catch (err) {
        console.error('[log-execution] bot forward failed:', err.message)
    }
})

module.exports = router
