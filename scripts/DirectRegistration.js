// scripts/DirectRegistration.js
const { ethers } = require("ethers");
const crypto = require("crypto");

/**
 * Generates a complete transaction for direct document registration via MetaMask
 * Claude can use this to provide a direct registration link to users
 */
class DirectRegistration {
  constructor(contractAddress) {
    this.contractAddress = contractAddress;
  }
  
  /**
   * Calculates document hash
   * @param {string} documentContent - Document text
   * @returns {string} - Document hash
   */
  calculateDocumentHash(documentContent) {
    return ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(documentContent)
    );
  }
  
  /**
   * Creates transaction data for MetaMask
   * @param {string} documentHash - Hash of the document
   * @param {string} documentType - Type of document
   * @param {string} metadata - Additional document metadata
   * @returns {object} - Transaction object for MetaMask
   */
  createTransactionData(documentHash, documentType, metadata) {
    // Encode function signature for 'registerDocument'
    const functionSignature = ethers.utils.id("registerDocument(bytes32,string,string)").slice(0, 10);
    
    // Encode parameters
    const abiCoder = new ethers.utils.AbiCoder();
    const encodedParams = abiCoder.encode(
      ["bytes32", "string", "string"],
      [documentHash, documentType, metadata]
    ).slice(2); // Remove '0x' prefix
    
    // Combine function signature and encoded parameters
    const data = functionSignature + encodedParams;
    
    // Return transaction object
    return {
      to: this.contractAddress,
      from: "{{METAMASK_ADDRESS}}", // This will be filled by MetaMask
      data: data,
      gas: "100000", // Gas limit
      value: "0" // No ETH to send
    };
  }
  
  /**
   * Generates a deep link for MetaMask transaction
   * @param {object} txData - Transaction data
   * @returns {string} - MetaMask deep link
   */
  generateMetaMaskLink(txData) {
    // Convert txData to URL-safe format
    const txParams = JSON.stringify(txData);
    const encodedTxParams = encodeURIComponent(txParams);
    
    // Generate MetaMask deep link
    return `https://metamask.io/deeplink.html#tx=${encodedTxParams}`;
  }
  
  /**
   * Generates complete registration instructions for Claude to provide to the user
   * @param {string} documentContent - The document text
   * @param {string} documentType - Type of document (e.g., "NDA", "Employment Contract")
   * @param {string} metadata - Additional document metadata
   * @returns {object} - Contains transaction data, MetaMask link, and instructions
   */
  generateRegistrationPackage(documentContent, documentType, metadata) {
    // Calculate document hash
    const documentHash = this.calculateDocumentHash(documentContent);
    
    // Create transaction data
    const txData = this.createTransactionData(documentHash, documentType, metadata);
    
    // Generate MetaMask link
    const metaMaskLink = this.generateMetaMaskLink(txData);
    
    // Create user instructions
    const instructions = `
## Register Document on Blockchain

Your ${documentType} is ready to be registered on the Ethereum blockchain for verification.

1. **Connect MetaMask**: Make sure your MetaMask wallet is connected to the Sepolia testnet.
2. **Register Document**: Click the link below to open the transaction in MetaMask:
   [Register Document on Blockchain](${metaMaskLink})
3. **Review & Confirm**: Check the transaction details and click "Confirm" in MetaMask.
4. **Save Document Hash**: This is your document's unique fingerprint:
   \`${documentHash}\`

Keep a copy of your document and this hash for future verification.
`;
    
    return {
      documentHash,
      txData,
      metaMaskLink,
      instructions
    };
  }
}

module.exports = DirectRegistration;