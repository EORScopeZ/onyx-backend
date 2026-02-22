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
        .card { position:relative;z-index:1;background:rgba(15,15,30,0.82);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:44px 40px 36px;width:100%;max-width:440px;box-shadow:0 0 60px rgba(139,127,255,0.12),0 20px 60px rgba(0,0,0,0.5);backdrop-filter:blur(14px);text-align:center; }
        .card::before { content:'';position:absolute;top:0;left:20px;right:20px;height:3px;background:linear-gradient(90deg,#8b7fff,#a78bfa,#8b7fff);border-radius:0 0 4px 4px; }
        .logo { font-size:32px;font-weight:900;letter-spacing:6px;background:linear-gradient(135deg,#fff 30%,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px; }
        .subtitle { font-size:12px;color:#8b7fff;letter-spacing:2px;text-transform:uppercase;margin-bottom:32px; }
        .info { background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px 22px;margin-bottom:28px;text-align:left; }
        .step { display:flex;align-items:flex-start;gap:10px;margin-bottom:12px; }
        .step:last-child{margin-bottom:0}
        .step-num { background:rgba(139,127,255,0.25);color:#a78bfa;font-size:11px;font-weight:700;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px; }
        .step-text { font-size:13px;color:#aaa;line-height:1.5; }
        .step-text strong { color:#d4d0ff }
        .footer { margin-top:24px;font-size:11px;color:#333;letter-spacing:0.5px; }
    </style>
</head>
<body>
<div class="bg"><div class="blob blob1"></div><div class="blob blob2"></div><div class="blob blob3"></div></div>
<div class="card">
    <div class="logo">ONYX</div>
    <div class="subtitle">Access System</div>
    <div class="info">
        <div class="step"><div class="step-num">1</div><div class="step-text">Join the <strong>Discord server</strong> to request access.</div></div>
        <div class="step"><div class="step-num">2</div><div class="step-text">Once whitelisted, you'll receive the <strong>daily key</strong> in Discord.</div></div>
        <div class="step"><div class="step-num">3</div><div class="step-text">Enter the key in the <strong>Onyx auth screen</strong> in Roblox.</div></div>
    </div>
    <div class="footer">Whitelist-based access · Keys rotate daily</div>
</div>
</body></html>`

module.exports = router
