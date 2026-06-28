#!/usr/bin/env node

const crypto = require("crypto");
const { createECDH } = crypto;

function base64UrlEncode(buffer) {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function generateVapidKeys() {
  const ecdh = createECDH("prime256v1");
  ecdh.generateKeys();

  const publicKey = base64UrlEncode(ecdh.getPublicKey());
  const privateKey = base64UrlEncode(ecdh.getPrivateKey());

  console.log("=== VAPID Keys Generated ===\n");
  console.log("Add these to your Supabase Edge Function secrets:\n");
  console.log(`VAPID_PUBLIC_KEY=${publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${privateKey}`);
  console.log(`VAPID_SUBJECT=mailto:your-email@example.com`);
  console.log("\nAdd this to your .env file:\n");
  console.log(`VITE_VAPID_PUBLIC_KEY=${publicKey}`);
  console.log("\nRun this to set Supabase secrets:\n");
  console.log("supabase secrets set VAPID_PUBLIC_KEY=" + publicKey);
  console.log("supabase secrets set VAPID_PRIVATE_KEY=" + privateKey);
  console.log("supabase secrets set VAPID_SUBJECT=mailto:your-email@example.com");
}

generateVapidKeys();
