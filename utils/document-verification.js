// utils/document-verification.js
const { ethers } = require("ethers");
const { calculateDocumentHash } = require("./document-hash");

/**
 * Utility for document verification via conversation with Claude
 */
class DocumentVerification {
  /**
   * Constructor
   * @param {string} contractAddress - The document registry contract address
   * @param {number} chainId - Chain ID for the network (11155111 for Sepolia)
   */
  constructor(contractAddress, chainId = 11155111) {
    this.contractAddress = contractAddress;
    this.chainId = chainId;
  }
  
  /**
   * Creates transaction data for verification
   * @param {string} documentId - ID of the document (with or without 0x prefix)
   * @param {string} documentContent - Content of the document to verify
   * @returns {object} - Transaction object for MetaMask
   */
  createVerificationData(documentId, documentContent) {
    try {
      // Calculate document hash
      const documentHash = calculateDocumentHash(documentContent);
      
      // Format document ID if needed
      if (!documentId.startsWith("0x")) {
        documentId = "0x" + documentId;
      }
      
      // Ensure documentId is properly padded to bytes32
      while (documentId.length < 66) {
        documentId = documentId.replace("0x", "0x0");
      }
      
      // Encode function signature for 'verifyDocument'
      const iface = new ethers.utils.Interface([
        "function verifyDocument(bytes32 _documentId, bytes32 _documentHash) public returns (bool)"
      ]);
      
      // Encode the function call
      const data = iface.encodeFunctionData("verifyDocument", [
        documentId, 
        documentHash
      ]);
      
      // Return transaction object
      return {
        to: this.contractAddress,
        data: data,
        gas: "0xC350", // 50,000 gas in hex
        value: "0x0", // No ETH to send
        chainId: this.chainId
      };
    } catch (error) {
      console.error("Error creating verification data:", error);
      throw new Error(`Failed to create verification data: ${error.message}`);
    }
  }
  
  /**
   * Generates a deep link for MetaMask verification transaction
   * @param {object} txData - Transaction data
   * @returns {string} - MetaMask deep link
   */
  generateVerificationLink(txData) {
    try {
      // Create a proper EIP-681 Ethereum URL
      const baseUrl = `ethereum:${this.contractAddress}@${this.chainId}`;
      
      // Create query parameters
      const params = new URLSearchParams();
      if (txData.data) params.append('data', txData.data);
      if (txData.gas) params.append('gas', txData.gas);
      if (txData.value && txData.value !== '0x0') params.append('value', txData.value);
      
      const queryString = params.toString();
      return `${baseUrl}?${queryString}`;
    } catch (error) {
      console.error("Error generating verification link:", error);
      throw new Error(`Failed to generate verification link: ${error.message}`);
    }
  }
  
  /**
   * Generates complete verification instructions for Claude to provide to the user
   * @param {string} documentId - The document ID
   * @param {string} documentContent - The document text
   * @returns {object} - Contains verification data and instructions
   */
  generateVerificationPackage(documentId, documentContent) {
    try {
      // Calculate document hash
      const documentHash = calculateDocumentHash(documentContent);
      
      // Create verification transaction data
      const txData = this.createVerificationData(documentId, documentContent);
      
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

Document information:
- Document ID: ${documentId}
- Document Hash: ${documentHash}

The verification process will compare this document's hash with the one stored on the blockchain. The transaction will return a result showing whether the document is authentic and unchanged.
`;
      
      return {
        documentHash,
        txData,
        verificationLink,
        instructions
      };
    } catch (error) {
      console.error("Error generating verification package:", error);
      throw new Error(`Failed to generate verification package: ${error.message}`);
    }
  }
}

module.exports = DocumentVerification;