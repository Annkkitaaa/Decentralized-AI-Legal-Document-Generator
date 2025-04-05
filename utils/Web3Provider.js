// utils/Web3Provider.js
/**
 * Utility functions for web3 connections via MetaMask
 */

// Generate transaction data for document registration
function generateRegistrationTransaction(documentContent, documentType, metadata) {
    // This function will return a formatted transaction object
    // that can be directly used with MetaMask
    
    const documentHash = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(documentContent)
    );
    
    // ABI for the registerDocument function
    const functionAbi = {
      inputs: [
        { name: "_documentHash", type: "bytes32" },
        { name: "_documentType", type: "string" },
        { name: "_metadata", type: "string" }
      ],
      name: "registerDocument",
      outputs: [{ name: "", type: "bytes32" }],
      stateMutability: "nonpayable",
      type: "function"
    };
    
    // Encode the function call
    const functionData = ethers.utils.defaultAbiCoder.encode(
      ["bytes32", "string", "string"],
      [documentHash, documentType, metadata]
    );
    
    // Create the final transaction data
    const transactionData = {
      to: process.env.DOCUMENT_REGISTRY_ADDRESS, // Contract address
      data: "0x" + functionAbi.name + functionData.slice(2), // Function signature + data
      value: "0x0", // No ETH sent with transaction
      gas: ethers.utils.hexlify(100000), // Gas limit
    };
    
    return {
      documentHash,
      transactionData
    };
  }
  
  // Generate verification instructions for Claude to provide
  function generateVerificationInstructions(documentId) {
    return `
  To verify this document in the future:
  1. Have the original document content ready
  2. Connect your MetaMask wallet to Sepolia testnet
  3. Either:
     a) Use the verification link: https://verify.legal-docs.example/verify/${documentId}
     b) Run this command if you have the project code: 
        \`\`\`
        npx hardhat run scripts/verify-document.js --network sepolia ${documentId} path/to/document.txt
        \`\`\`
  `;
  }
  
  // Create MetaMask connection instructions for Claude to provide
  function generateMetaMaskInstructions() {
    return `
  To connect MetaMask and register this document:
  
  1. Make sure you have the MetaMask browser extension installed
  2. Click on the MetaMask icon in your browser toolbar
  3. Log in to your wallet if needed
  4. Make sure you're connected to the Sepolia testnet
     - Click on the network dropdown at the top of MetaMask
     - Select "Sepolia Test Network"
  5. Make sure you have some test ETH in your wallet
     - If not, you can get test ETH from https://sepoliafaucet.com
  6. When you click the transaction link I'll provide, MetaMask will open with the transaction details
  7. Review the transaction details and click "Confirm" to register your document
  `;
  }
  
  module.exports = {
    generateRegistrationTransaction,
    generateVerificationInstructions,
    generateMetaMaskInstructions
  };