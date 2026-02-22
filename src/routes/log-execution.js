const express    = require('express')
const router     = express.Router()
const supabase   = require('../services/supabase')

router.post('/', async (req, res) => {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
             || req.socket?.remoteAddress
             || 'unknown'

    const roblox_username = (req.body.username || req.body.roblox_user || 'Unknown').trim().toLowerCase()
    const event           = req.body.event || req.body.type || 'execution'

    try {
        const { error } = await supabase.from('logs').insert({
            roblox_username,
            event,
            ip,
        })

        if (error) throw error

        // Forward to Discord bot for real-time notification if BOT_URL is set
        const botUrl = process.env.BOT_URL
        if (botUrl) {
            fetch(`${botUrl.replace(/\/$/, '')}/log-execution`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ ...req.body, ip }),
            }).catch(e => console.error('[log-execution] bot forward failed:', e))
        }

        return res.json({ ok: true })

    } catch (err) {
        console.error('[log-execution]', err)
        return res.json({ ok: false })
    }
})

module.exports = router
