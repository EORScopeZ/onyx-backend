const express = require('express')
const router  = express.Router()
const supabase = require('../services/supabase')

// Public endpoint to get the current valid key
router.get('/current', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('system_settings')
            .select('value, expires_at')
            .eq('type', 'global_key')
            .maybeSingle()

        if (error) throw error

        if (!data) return res.json({ key: null, message: 'No key set.' })

        if (data.expires_at && new Date(data.expires_at) < new Date()) {
            return res.json({ key: null, message: 'Key has expired.' })
        }

        return res.json({ key: data.value, expires_at: data.expires_at })
    } catch (err) {
        console.error('[getkey/current]', err)
        return res.status(500).json({ key: null, message: 'Server error.' })
    }
})

router.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html')
    res.send(HTML)
})

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Onyx — Get Access</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #05050f; color: #fff; font-family: 'Segoe UI', system-ui, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
        .blob { position: absolute; border-radius: 50%; filter: blur(90px); opacity: 0.18; animation: drift 12s ease-in-out infinite alternate; }
        .blob1 { width:500px;height:500px;background:#8b7fff;top:-100px;left:-100px; }
        .blob2 { width:400px;height:400px;background:#5b3fe3;bottom:-80px;right:-80px;animation-delay:-4s; }
        .blob3 { width:300px;height:300px;background:#a78bfa;top:50%;left:50%;transform:translate(-50%,-50%);animation-delay:-8s; }
        @keyframes drift { from{transform:translate(0,0) scale(1)} to{transform:translate(30px,20px) scale(1.08)} }
        .card { position:relative;z-index:1;background:rgba(15,15,30,0.82);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:44px 40px 36px;width:100%;max-width:460px;box-shadow:0 0 60px rgba(139,127,255,0.12),0 20px 60px rgba(0,0,0,0.5);backdrop-filter:blur(14px);text-align:center; }
        .card::before { content:'';position:absolute;top:0;left:20px;right:20px;height:3px;background:linear-gradient(90deg,#8b7fff,#a78bfa,#8b7fff);border-radius:0 0 4px 4px; }
        .logo { font-size:32px;font-weight:900;letter-spacing:6px;background:linear-gradient(135deg,#fff 30%,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px; }
        .subtitle { font-size:12px;color:#8b7fff;letter-spacing:2px;text-transform:uppercase;margin-bottom:32px; }
        .info { background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px 22px;margin-bottom:24px;text-align:left; }
        .step { display:flex;align-items:flex-start;gap:10px;margin-bottom:12px; }
        .step:last-child{margin-bottom:0}
        .step-num { background:rgba(139,127,255,0.25);color:#a78bfa;font-size:11px;font-weight:700;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px; }
        .step-text { font-size:13px;color:#aaa;line-height:1.5; }
        .step-text strong { color:#d4d0ff }

        /* Get Key button */
        .btn-getkey {
            width:100%;padding:14px;border:none;border-radius:12px;
            background:linear-gradient(135deg,#8b7fff,#5b3fe3);
            color:#fff;font-size:15px;font-weight:700;letter-spacing:1px;
            cursor:pointer;transition:opacity 0.2s,transform 0.1s;
            margin-bottom:16px;
        }
        .btn-getkey:hover { opacity:0.88; transform:translateY(-1px); }
        .btn-getkey:active { transform:translateY(0); }
        .btn-getkey:disabled { opacity:0.5; cursor:not-allowed; transform:none; }

        /* Key display box */
        .key-box {
            display:none;
            background:rgba(139,127,255,0.08);
            border:1px solid rgba(139,127,255,0.35);
            border-radius:12px;padding:16px 18px;margin-bottom:16px;
            text-align:left;
        }
        .key-label { font-size:10px;color:#8b7fff;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px; }
        .key-value-row { display:flex;align-items:center;gap:10px; }
        .key-value {
            flex:1;font-family:'Courier New',monospace;font-size:14px;
            color:#d4d0ff;word-break:break-all;user-select:all;
        }
        .btn-copy {
            background:rgba(139,127,255,0.2);border:1px solid rgba(139,127,255,0.4);
            color:#a78bfa;font-size:11px;font-weight:700;padding:6px 12px;
            border-radius:8px;cursor:pointer;white-space:nowrap;transition:background 0.2s;
            flex-shrink:0;
        }
        .btn-copy:hover { background:rgba(139,127,255,0.35); }
        .key-expires { font-size:11px;color:#555;margin-top:10px; }

        /* Error/loading states */
        .msg { font-size:13px;padding:12px 16px;border-radius:10px;margin-bottom:16px;display:none; }
        .msg.error { background:rgba(255,80,80,0.1);border:1px solid rgba(255,80,80,0.25);color:#ff8080; }
        .msg.loading { background:rgba(139,127,255,0.08);border:1px solid rgba(139,127,255,0.2);color:#a78bfa; }
        .copied { color:#7fff9e !important; }

        .footer { margin-top:20px;font-size:11px;color:#333;letter-spacing:0.5px; }
    </style>
</head>
<body>
<div class="bg"><div class="blob blob1"></div><div class="blob blob2"></div><div class="blob blob3"></div></div>
<div class="card">
    <div class="logo">ONYX</div>
    <div class="subtitle">Get Your Key</div>

    <div class="info">
        <div class="step"><div class="step-num">1</div><div class="step-text">Click <strong>Get Key</strong> below to reveal the current access key.</div></div>
        <div class="step"><div class="step-num">2</div><div class="step-text">Keys are valid for <strong>48 hours</strong> — copy it before it expires.</div></div>
        <div class="step"><div class="step-num">3</div><div class="step-text">Enter the key in the <strong>Onyx auth screen</strong> in Roblox.</div></div>
    </div>

    <div class="msg error" id="errMsg"></div>
    <div class="msg loading" id="loadMsg">Fetching key...</div>

    <button class="btn-getkey" id="btnGetKey" onclick="fetchKey()">🔑 Get Key</button>

    <div class="key-box" id="keyBox">
        <div class="key-label">Your Access Key</div>
        <div class="key-value-row">
            <div class="key-value" id="keyValue"></div>
            <button class="btn-copy" id="btnCopy" onclick="copyKey()">Copy</button>
        </div>
        <div class="key-expires" id="keyExpires"></div>
    </div>

    <div class="footer">Keys rotate every 48 hours · Whitelist = permanent access</div>
</div>

<script>
    async function fetchKey() {
        const btn = document.getElementById('btnGetKey')
        const errMsg = document.getElementById('errMsg')
        const loadMsg = document.getElementById('loadMsg')
        const keyBox = document.getElementById('keyBox')

        btn.disabled = true
        errMsg.style.display = 'none'
        keyBox.style.display = 'none'
        loadMsg.style.display = 'block'

        try {
            const res = await fetch('/getkey/current')
            const data = await res.json()

            loadMsg.style.display = 'none'

            if (!data.key) {
                errMsg.textContent = data.message || 'No active key right now. Check back later.'
                errMsg.style.display = 'block'
                btn.disabled = false
                return
            }

            document.getElementById('keyValue').textContent = data.key

            if (data.expires_at) {
                const exp = new Date(data.expires_at)
                const now = new Date()
                const diffMs = exp - now
                const diffHrs = Math.floor(diffMs / 3600000)
                const diffMins = Math.floor((diffMs % 3600000) / 60000)
                document.getElementById('keyExpires').textContent =
                    'Expires in ' + (diffHrs > 0 ? diffHrs + 'h ' : '') + diffMins + 'm'
            }

            keyBox.style.display = 'block'
            btn.textContent = '🔄 Refresh Key'
            btn.disabled = false

        } catch (e) {
            loadMsg.style.display = 'none'
            errMsg.textContent = 'Failed to fetch key. Try again.'
            errMsg.style.display = 'block'
            btn.disabled = false
        }
    }

    function copyKey() {
        const val = document.getElementById('keyValue').textContent
        navigator.clipboard.writeText(val).then(() => {
            const btn = document.getElementById('btnCopy')
            btn.textContent = 'Copied!'
            btn.classList.add('copied')
            setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied') }, 2000)
        })
    }
</script>
</body></html>`

module.exports = router
