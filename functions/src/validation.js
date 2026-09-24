function cleanWish(body) {
  const name = typeof body === "object" && typeof body.name === "string" ? body.name.trim() : "";
  const message = typeof body === "object" && typeof body.message === "string" ? body.message.trim() : "";
  const clientId = typeof body === "object" && typeof body.clientId === "string" && /^[A-Za-z0-9]{20}$/.test(body.clientId) ? body.clientId : null;
  if (!name || name.length > 40 || !message || message.length > 140) return null;
  return {name, message, ...(clientId ? {clientId} : {})};
}

module.exports = {cleanWish};
