const express = require('express')
const router  = express.Router()

router.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html')
    res.send(HTML)
})

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Onyx — Get Your Key</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #05050f; color: #fff; font-family: 'Segoe UI', system-ui, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
        .blob { position: absolute; border-radius: 50%; filter: blur(90px); opacity: 0.18; animation: drift 12s ease-in-out infinite alternate; }
        .blob1 { width:500px;height:500px;background:#8b7fff;top:-100px;left:-100px; }
        .blob2 { width:400px;height:400px;background:#5b3fe3;bottom:-80px;right:-80px;animation-delay:-4s; }
        .blob3 { width:300px;height:300px;background:#a78bfa;top:50%;left:50%;transform:translate(-50%,-50%);animation-delay:-8s; }
        @keyframes drift { from{transform:translate(0,0) scale(1)} to{transform:translate(30px,20px) scale(1.08)} }

        .card {
            position:relative;z-index:1;background:rgba(15,15,30,0.82);
            border:1px solid rgba(255,255,255,0.1);border-radius:20px;
            padding:44px 40px 36px;width:100%;max-width:460px;
            box-shadow:0 0 60px rgba(139,127,255,0.12),0 20px 60px rgba(0,0,0,0.5);
            backdrop-filter:blur(14px);text-align:center;
        }
        .card::before {
            content:'';position:absolute;top:0;left:20px;right:20px;height:3px;
            background:linear-gradient(90deg,#8b7fff,#a78bfa,#8b7fff);border-radius:0 0 4px 4px;
        }
        .logo {
            font-size:32px;font-weight:900;letter-spacing:6px;
            background:linear-gradient(135deg,#fff 30%,#a78bfa);
            -webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px;
        }
        .subtitle { font-size:12px;color:#8b7fff;letter-spacing:2px;text-transform:uppercase;margin-bottom:28px; }

        .info { background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:16px 18px;margin-bottom:24px;text-align:left; }
        .step { display:flex;align-items:flex-start;gap:10px;margin-bottom:10px; }
        .step:last-child{margin-bottom:0}
        .step-num { background:rgba(139,127,255,0.25);color:#a78bfa;font-size:11px;font-weight:700;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px; }
        .step-text { font-size:13px;color:#aaa;line-height:1.5; }
        .step-text strong { color:#d4d0ff }

        /* Key box */
        .key-box {
            display:none;background:rgba(139,127,255,0.08);
            border:1px solid rgba(139,127,255,0.35);border-radius:12px;
            padding:18px 18px;margin-bottom:16px;text-align:left;
        }
        .key-label { font-size:10px;color:#8b7fff;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px; }
        .key-value-row { display:flex;align-items:center;gap:10px;margin-bottom:10px; }
        .key-value { flex:1;font-family:'Courier New',monospace;font-size:15px;color:#d4d0ff;word-break:break-all;user-select:all;font-weight:700; }
        .btn-copy {
            background:rgba(139,127,255,0.2);border:1px solid rgba(139,127,255,0.4);
            color:#a78bfa;font-size:11px;font-weight:700;padding:7px 16px;
            border-radius:8px;cursor:pointer;white-space:nowrap;transition:background 0.2s;flex-shrink:0;
        }
        .btn-copy:hover { background:rgba(139,127,255,0.38); }
        .key-meta { display:flex;justify-content:space-between;font-size:11px;color:#555; }
        .key-hwid-note { font-size:11px;color:#555;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.05); }

        /* Wait / countdown box */
        .wait-box {
            display:none;background:rgba(255,170,0,0.07);
            border:1px solid rgba(255,170,0,0.3);border-radius:12px;
            padding:18px 18px;margin-bottom:16px;text-align:center;
        }
        .wait-title { font-size:15px;font-weight:700;color:#ffaa00;margin-bottom:6px; }
        .wait-desc  { font-size:13px;color:#888;margin-bottom:14px; }
        .countdown  { font-size:28px;font-weight:900;color:#ffaa00;letter-spacing:2px;font-family:'Courier New',monospace; }
        .countdown-label { font-size:11px;color:#555;margin-top:4px; }

        /* Loading */
        .loading-box {
            padding:20px;text-align:center;color:#8b7fff;font-size:13px;
        }
        .spinner {
            width:32px;height:32px;border:3px solid rgba(139,127,255,0.2);
            border-top-color:#8b7fff;border-radius:50%;
            animation:spin 0.8s linear infinite;margin:0 auto 12px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .msg-error {
            display:none;background:rgba(255,80,80,0.1);border:1px solid rgba(255,80,80,0.25);
            color:#ff8080;font-size:13px;padding:12px 16px;border-radius:10px;margin-bottom:14px;
        }
        .copied { color:#7fff9e !important; border-color:rgba(127,255,158,0.4) !important; }
        .footer { margin-top:20px;font-size:11px;color:#333;letter-spacing:0.5px; }
    </style>
</head>
<body>
<div class="bg"><div class="blob blob1"></div><div class="blob blob2"></div><div class="blob blob3"></div></div>
<div class="card">
    <div class="logo">ONYX</div>
    <div class="subtitle">Get Your Key</div>

    <div class="info">
        <div class="step"><div class="step-num">1</div><div class="step-text">Your personal key is generated automatically for your connection.</div></div>
        <div class="step"><div class="step-num">2</div><div class="step-text">Copy it and paste it into the <strong>Onyx auth screen</strong> in Roblox.</div></div>
        <div class="step"><div class="step-num">3</div><div class="step-text">Keys last <strong>24 hours</strong> and are <strong>device-locked</strong> on first use.</div></div>
    </div>

    <div class="msg-error" id="errMsg"></div>

    <div class="loading-box" id="loadingBox">
        <div class="spinner"></div>
        Fetching your key...
    </div>

    <!-- Key display -->
    <div class="key-box" id="keyBox">
        <div class="key-label">Your Personal Key</div>
        <div class="key-value-row">
            <div class="key-value" id="keyValue"></div>
            <button class="btn-copy" id="btnCopy" onclick="copyKey()">Copy</button>
        </div>
        <div class="key-meta">
            <span id="keyExpires"></span>
            <span id="keyBadge"></span>
        </div>
        <div class="key-hwid-note">🔒 Locks to your device (HWID) the first time you use it in Roblox.</div>
    </div>

    <!-- Countdown (already used) -->
    <div class="wait-box" id="waitBox">
        <div class="wait-title">⏳ Key Already Active</div>
        <div class="wait-desc">Your key for this window is in use. Next key available in:</div>
        <div class="countdown" id="countdown">--:--:--</div>
        <div class="countdown-label">hours : minutes : seconds</div>
    </div>

    <div class="footer">One key per connection per 24 hours · Keys auto-rotate</div>
</div>

<script>
    let countdownInterval = null

    async function loadKey() {
        try {
            const res  = await fetch('/get-user-key')
            const data = await res.json()

            document.getElementById('loadingBox').style.display = 'none'

            if (data.error) {
                showError(data.error)
                return
            }

            if (data.locked) {
                // Key used — show countdown to expiry
                showCountdown(data.expires_at)
                return
            }

            // Show the key
            document.getElementById('keyValue').textContent  = data.key
            document.getElementById('keyBadge').textContent  = data.fresh ? '🆕 New key' : '♻️ Your active key'
            document.getElementById('keyBox').style.display  = 'block'

            if (data.expires_at) {
                const exp     = new Date(data.expires_at)
                const now     = new Date()
                const diffMs  = exp - now
                const diffHrs = Math.floor(diffMs / 3600000)
                const diffMin = Math.floor((diffMs % 3600000) / 60000)
                document.getElementById('keyExpires').textContent =
                    'Expires in ' + (diffHrs > 0 ? diffHrs + 'h ' : '') + diffMin + 'm'
            }

        } catch (e) {
            document.getElementById('loadingBox').style.display = 'none'
            showError('Failed to fetch key. Please refresh the page.')
        }
    }

    function showCountdown(expiresAt) {
        document.getElementById('waitBox').style.display = 'block'
        const target = new Date(expiresAt)

        function tick() {
            const now  = new Date()
            const diff = target - now
            if (diff <= 0) {
                document.getElementById('countdown').textContent = '00:00:00'
                clearInterval(countdownInterval)
                return
            }
            const h = Math.floor(diff / 3600000)
            const m = Math.floor((diff % 3600000) / 60000)
            const s = Math.floor((diff % 60000) / 1000)
            document.getElementById('countdown').textContent =
                String(h).padStart(2,'0') + ':' +
                String(m).padStart(2,'0') + ':' +
                String(s).padStart(2,'0')
        }
        tick()
        countdownInterval = setInterval(tick, 1000)
    }

    function showError(msg) {
        const el = document.getElementById('errMsg')
        el.textContent   = msg
        el.style.display = 'block'
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

    // Auto-load on page open
    loadKey()
</script>
</body></html>`

module.exports = router
