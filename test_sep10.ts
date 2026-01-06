import { Sep10Client } from "@colibri/sep10";

const client = new Sep10Client({
  authEndpoint: "https://example.com/auth",
  // serverPublicKey might be optional if we don't verify? or required?
  serverPublicKey: "G...",
});

// Mock fetch to see what it requests
globalThis.fetch = async (input, init) => {
  console.log("Fetch called with:", input, init);
  // Return a mock structure
  return new Response(JSON.stringify({ transaction: "AAAA..." }));
};

try {
  await client.getChallenge({ account: "G..." });
} catch (e) {
  console.log("Error:", e);
}
