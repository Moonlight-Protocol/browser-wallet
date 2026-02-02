import { Sep10Client } from "@colibri/sep10";

const client = new Sep10Client({
  authEndpoint: "https://example.com/auth",
  // serverPublicKey might be optional if we don't verify? or required?
  serverPublicKey: "G...",
  homeDomain: "example.com",
  networkPassphrase: "",
});

// Mock fetch to see what it requests
globalThis.fetch = (input, init) => {
  console.log("Fetch called with:", input, init);
  // Return a mock structure
  return Promise.resolve(
    new Response(JSON.stringify({ transaction: "AAAA..." })),
  );
};

try {
  await client.getChallenge({ account: "G..." });
} catch (e) {
  console.log("Error:", e);
}
