const crypto = require("crypto");

function createSHA256Hash(input) {
  return crypto
    .createHash("sha256") // Specify the algorithm
    .update(input) // Add the data to be hashed
    .digest("hex"); // Output the hash in hexadecimal format
}

const myString = "Khuong19992404:docusaurus_pw+123@_Khuong";
const hash = createSHA256Hash(myString);
console.log(`SHA-256 Hash: ${hash}`);
// Example output: SHA-256 Hash: d94019159045768560126744005c2a13e540134015082087e59e35c36c1e55c7
