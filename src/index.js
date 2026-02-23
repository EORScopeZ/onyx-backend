require('dotenv').config()
const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')

const validateRoute = require('./routes/validate')
const whitelistRoute = require('./routes/whitelist')
const blacklistRoute = require('./routes/blacklist')
const listWhitelistRoute = require('./routes/list-whitelist')
const setGlobalKeyRoute = require('./routes/set-global-key')
const setNametagRoute = require('./routes/set-nametag')
const getNametagRoute = require('./routes/get-nametag')
const nametagsRoute = require('./routes/nametags')
const registerUserRoute = require('./routes/register-onyx-user')
const logExecutionRoute = require('./routes/log-execution')
const supabase = require('./services/supabase') // Already required by other routes but we need it here now
const statusRoute = require('./routes/status')
const getkeyRoute = require('./routes/getkey')

const app = express()

app.set('trust proxy', 1) // Required for Railway — fixes express-rate-limit crash

app.use(cors())
app.use(express.json())

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5000 }) // High limit for heartbeats
app.use(limiter)

// ── Roblox / public routes ──────────────────────────────────────────────────
app.use('/api/validate', validateRoute)
app.use('/api/register-onyx-user', registerUserRoute)
app.use('/api/log-execution', logExecutionRoute)
app.use('/api/get-nametag', getNametagRoute)
app.get('/api/registered-users', async (req, res) => {
    try {
        const job_id = (req.query.job_id || '').trim()
        const recentThreshold = new Date(Date.now() - 120000).toISOString()
        let query = supabase.from('users').select('roblox_username').gte('last_heartbeat', recentThreshold)
        if (job_id) query = query.eq('job_id', job_id)
        const { data, error } = await query
        if (error) return res.status(500).json({ error: error.message })
        const usernames = [...new Set(data.filter(u => u.roblox_username).map(u => u.roblox_username.toLowerCase()))]
        res.status(200).json({ usernames })
    } catch (err) { res.status(500).json({ error: 'Internal error' }) }
})
app.use('/api/nametags', nametagsRoute)
app.use('/getkey', getkeyRoute)

// ── Bot / admin routes (/api/ prefix) ──────────────────────────────────────
app.use('/api/whitelist', whitelistRoute)
app.use('/api/unwhitelist', whitelistRoute)
app.use('/api/blacklist', blacklistRoute)
app.use('/api/unblacklist', blacklistRoute)
app.use('/api/list-whitelist', listWhitelistRoute)
app.use('/api/set-global-key', setGlobalKeyRoute)
app.use('/api/set-nametag', setNametagRoute)
app.use('/api/status', statusRoute)

// ── Bare routes — bot calls these without /api/ prefix ─────────────────────
app.use('/whitelist', whitelistRoute)
app.use('/unwhitelist', whitelistRoute)
app.use('/blacklist', blacklistRoute)
app.use('/unblacklist', blacklistRoute)
app.use('/list-whitelist', listWhitelistRoute)
app.use('/set-global-key', setGlobalKeyRoute)
app.use('/set-nametag', setNametagRoute)
app.use('/status', statusRoute)
app.use('/get-nametag', getNametagRoute)
app.use('/create-key', setGlobalKeyRoute)
app.use('/api/create-key', setGlobalKeyRoute)

// ── Roblox client routes (called directly from Lua) ─────────────────────────
app.use('/validate-user', validateRoute)  // Lua calls this
app.use('/validate', validateRoute)
app.use('/log-execution', logExecutionRoute)
app.use('/register-onyx-user', registerUserRoute)
app.get('/registered-users', async (req, res) => {
    try {
        const job_id = (req.query.job_id || '').trim()
        const recentThreshold = new Date(Date.now() - 120000).toISOString()
        let query = supabase.from('users').select('roblox_username').gte('last_heartbeat', recentThreshold)
        if (job_id) query = query.eq('job_id', job_id)
        const { data, error } = await query
        if (error) return res.status(500).json({ error: error.message })
        const usernames = [...new Set(data.filter(u => u.roblox_username).map(u => u.roblox_username.toLowerCase()))]
        res.status(200).json({ usernames })
    } catch (err) { res.status(500).json({ error: 'Internal error' }) }
})
app.listen(process.env.PORT || 3000, () => {
    console.log(`Onyx backend running on port ${process.env.PORT || 3000}`)
})
