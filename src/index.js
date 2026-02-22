require('dotenv').config()
const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')

const validateRoute       = require('./routes/validate')
const whitelistRoute      = require('./routes/whitelist')
const blacklistRoute      = require('./routes/blacklist')
const listWhitelistRoute  = require('./routes/list-whitelist')
const setGlobalKeyRoute   = require('./routes/set-global-key')
const setNametagRoute     = require('./routes/set-nametag')
const getNametagRoute     = require('./routes/get-nametag')
const nametagsRoute       = require('./routes/nametags')
const registerUserRoute   = require('./routes/register-onyx-user')
const logExecutionRoute   = require('./routes/log-execution')
const statusRoute         = require('./routes/status')
const getkeyRoute         = require('./routes/getkey')

const app = express()

app.use(cors())
app.use(express.json())

// Rate limiter — relaxed slightly for heartbeat endpoints
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 })
app.use(limiter)

// ── Roblox / public routes ──────────────────────────────────────────────────
app.post('/api/validate',            validateRoute)
app.post('/api/register-onyx-user',  registerUserRoute)
app.post('/api/log-execution',       logExecutionRoute)
app.get( '/api/get-nametag/:username', getNametagRoute)
app.get( '/api/nametags',            nametagsRoute)
app.get( '/getkey',                  getkeyRoute)

// ── Bot / admin routes (require API_SECRET header) ──────────────────────────
app.post('/api/whitelist',           whitelistRoute)
app.post('/api/unwhitelist',         whitelistRoute)   // same handler, detects action
app.post('/api/blacklist',           blacklistRoute)
app.post('/api/unblacklist',         blacklistRoute)   // same handler, detects action
app.get( '/api/list-whitelist',      listWhitelistRoute)
app.post('/api/set-global-key',      setGlobalKeyRoute)
app.post('/api/set-nametag',         setNametagRoute)
app.get( '/api/status',              statusRoute)

app.listen(process.env.PORT || 3000, () => {
    console.log(`Onyx backend running on port ${process.env.PORT || 3000}`)
})
