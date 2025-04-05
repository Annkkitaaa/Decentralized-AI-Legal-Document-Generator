// utils/document-hash.js
const { ethers } = require("ethers");

/**
 * Calculates the hash of a document
 * @param {string} documentContent - The content of the document
 * @returns {string} - The document hash as a hex string
 */
function calculateDocumentHash(documentContent) {
  return ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(documentContent)
  );
}

/**
 * Calculates the document ID from its components
 * @param {string} documentHash - The hash of the document
 * @param {string} ownerAddress - The Ethereum address of the document owner
 * @param {number} timestamp - The timestamp when the document was created
 * @returns {string} - The document ID as a hex string
 */
function calculateDocumentId(documentHash, ownerAddress, timestamp) {
  return ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["bytes32", "address", "uint256"],
      [documentHash, ownerAddress, timestamp]
    )
  );
}

module.exports = {
  calculateDocumentHash,
  calculateDocumentId
};