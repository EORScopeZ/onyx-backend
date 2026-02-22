const { sendJson, sendCors, readBody, kvGet, kvSet, kvList } = require("../_lib");

const HEARTBEAT_TTL = 15; // seconds - same as original CF worker

const DEFAULT_CONFIG = {
  name_text: "Onyx User",
  tag_text: "ONYX",
  name_color: "#8b7fff",
  tag_color: "#1a1a2e",
  glow_color: "#6d5ae0",
  outline_color: "#000000",
  image_url: null,
};

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return sendCors(res);
  if (req.method !== "POST") return sendJson(res, { error: "Method not allowed." }, 405);

  const body = await readBody(req);
  const roblox_user = (body.roblox_user || "").trim().toLowerCase();
  if (!roblox_user) return sendJson(res, { ok: false }, 400);

  // Fetch persistent config for THIS user
  const customConfig = await kvGet(`nametag:config:${roblox_user}`);
  const userData = {
    ...DEFAULT_CONFIG,
    ...(customConfig || {}),
    roblox_user, // Ensure this is always set correctly
  };

  // Store with a short TTL - expires if heartbeat stops
  await kvSet(`active:user:${roblox_user}`, userData, HEARTBEAT_TTL);

  // Fetch ALL active users to send back to the client
  const keys = await kvList("active:user:");
  const nametags = await Promise.all(keys.map(async (k) => {
    const data = await kvGet(k);
    if (!data || !data.roblox_user) return null;

    // Optionally: re-fetch customConfig for each active user to ensure absolute freshness?
    // For now, the active:user: entry stores the config at the moment of heartbeat.
    return data;
  }));

  return sendJson(res, { ok: true, nametags: nametags.filter(Boolean) });
};
