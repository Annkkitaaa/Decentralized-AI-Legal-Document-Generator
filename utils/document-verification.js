// utils/document-verification.js
const { ethers } = require("ethers");

/**
 * Utility for document verification via conversation with Claude
 */
class DocumentVerification {
  constructor(contractAddress) {
    this.contractAddress = contractAddress;
  }
  
  /**
   * Calculates document hash from content
   * @param {string} documentContent - Document text
   * @returns {string} - Document hash
   */
  calculateDocumentHash(documentContent) {
    return ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(documentContent)
    );
  }
  
  /**
   * Creates transaction data for verification
   * @param {string} documentId - ID of the document
   * @param {string} documentHash - Hash of the document
   * @returns {object} - Transaction object for MetaMask
   */
  createVerificationData(documentId, documentHash) {
    // Encode function signature for 'verifyDocument'
    const functionSignature = ethers.utils.id("verifyDocument(bytes32,bytes32)").slice(0, 10);
    
    // Encode parameters
    const abiCoder = new ethers.utils.AbiCoder();
    const encodedParams = abiCoder.encode(
      ["bytes32", "bytes32"],
      [documentId, documentHash]
    ).slice(2); // Remove '0x' prefix
    
    // Combine function signature and encoded parameters
    const data = functionSignature + encodedParams;
    
    // Return transaction object
    return {
      to: this.contractAddress,
      from: "{{METAMASK_ADDRESS}}", // This will be filled by MetaMask
      data: data,
      gas: "50000", // Gas limit
      value: "0" // No ETH to send
    };
  }
  
  /**
   * Generates a deep link for MetaMask verification transaction
   * @param {object} txData - Transaction data
   * @returns {string} - MetaMask deep link
   */
  generateVerificationLink(txData) {
    // Convert txData to URL-safe format
    const txParams = JSON.stringify(txData);
    const encodedTxParams = encodeURIComponent(txParams);
    
    // Generate MetaMask deep link
    return `https://metamask.io/deeplink.html#tx=${encodedTxParams}`;
  }
  
  /**
   * Generates complete verification instructions for Claude to provide to the user
   * @param {string} documentId - The document ID
   * @param {string} documentContent - The document text
   * @returns {object} - Contains verification data and instructions
   */
  generateVerificationPackage(documentId, documentContent) {
    // Calculate document hash
    const documentHash = this.calculateDocumentHash(documentContent);
    
    // Create verification transaction data
    const txData = this.createVerificationData(documentId, documentHash);
    
    // Generate MetaMask link
    const verificationLink = this.generateVerificationLink(txData);
    
    // Create user instructions
    const instructions = `
## Verify Document Authenticity

I'll help you verify if this document matches what was registered on the blockchain.

1. **Connect MetaMask**: Make sure your MetaMask wallet is connected to the Sepolia testnet.
2. **Verify Document**: Click the link below to submit the verification transaction:
   [Verify Document Authenticity](${verificationLink})
3. **Review & Confirm**: Check the transaction details and click "Confirm" in MetaMask.

The transaction will return a result showing whether the document is authentic or has been altered.
`;
    
    return {
      documentHash,
      txData,
      verificationLink,
      instructions
    };
  }
}

module.exports = DocumentVerification;