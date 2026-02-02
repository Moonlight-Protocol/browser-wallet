import { Sep10Client } from "@colibri/sep10";
import { StellarToml } from "@colibri/core";

console.log(
  "Sep10Client prototype:",
  Object.getOwnPropertyNames(Sep10Client.prototype),
);
console.log(
  "StellarToml prototype:",
  Object.getOwnPropertyNames(StellarToml.prototype),
);
// Check if they are classes or objects
console.log("Sep10Client type:", typeof Sep10Client);
console.log("StellarToml type:", typeof StellarToml);

try {
  // Try to spy on constructor by passing nothing
  // @ts-ignore: TBD
  new Sep10Client();
} catch (e) {
  const error = e instanceof Error ? e : new Error(String(e));
  console.log("Sep10Client ctor error:", error.message);
}

try {
  // @ts-ignore: TBD
  const t = new StellarToml("http://example.com");
  console.log("StellarToml instance:", t);
} catch (e) {
  const error = e instanceof Error ? e : new Error(String(e));
  console.log("StellarToml ctor error:", error.message);
}
