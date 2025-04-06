// utils/Direct-Transaction-Helper.js
const ethers = require("ethers");

/**
 * Helper to generate direct transaction links for MetaMask
 */
class DirectTransactionHelper {
  /**
   * Constructor
   * @param {string} contractAddress - Address of the contract
   * @param {Object} contractABI - ABI of the contract
   * @param {number} chainId - Chain ID for the network (e.g., 11155111 for Sepolia)
   */
  constructor(contractAddress, contractABI, chainId = 11155111) {
    this.contractAddress = contractAddress;
    this.contractABI = contractABI;
    this.interface = new ethers.utils.Interface(contractABI);
    this.chainId = chainId;
  }
  
  /**
   * Encodes a function call
   * @param {string} functionName - Name of the function
   * @param {Array} params - Parameters for the function
   * @returns {string} - Encoded function data
   */
  encodeFunctionData(functionName, params) {
    try {
      return this.interface.encodeFunctionData(functionName, params);
    } catch (error) {
      console.error(`Error encoding function ${functionName}:`, error);
      throw new Error(`Failed to encode function call: ${error.message}`);
    }
  }
  
  /**
   * Creates a transaction object
   * @param {string} functionName - Name of the function
   * @param {Array} params - Parameters for the function
   * @param {string} gas - Gas limit (as hexstring)
   * @returns {Object} - Transaction object
   */
  createTransaction(functionName, params, gas = "0x186A0") { // 0x186A0 = 100,000
    try {
      const data = this.encodeFunctionData(functionName, params);
      
      return {
        to: this.contractAddress,
        data: data,
        gas: gas,
        value: "0x0"
      };
    } catch (error) {
      console.error(`Error creating transaction for ${functionName}:`, error);
      throw new Error(`Failed to create transaction: ${error.message}`);
    }
  }
  
  /**
   * Creates a MetaMask-compatible deep link
   * @param {Object} tx - Transaction object
   * @returns {string} - MetaMask deep link
   */
  createMetaMaskLink(tx) {
    try {
      // Create a proper EIP-681 Ethereum URL
      // Format: ethereum:ADDRESS@CHAINID/FUNCTION?param=value
      const baseUrl = `ethereum:${this.contractAddress}@${this.chainId}`;
      
      // Create query parameters
      const params = new URLSearchParams();
      if (tx.data) params.append('data', tx.data);
      if (tx.gas) params.append('gas', tx.gas);
      if (tx.value && tx.value !== '0x0') params.append('value', tx.value);
      
      const queryString = params.toString();
      return `${baseUrl}?${queryString}`;
    } catch (error) {
      console.error("Error creating MetaMask link:", error);
      throw new Error(`Failed to create MetaMask link: ${error.message}`);
    }
  }
  
  /**
   * Generates a complete transaction package for Claude to provide
   * @param {string} functionName - Contract function to call
   * @param {Array} params - Function parameters
   * @param {string} actionDescription - Description of the action
   * @returns {Object} - Transaction package with links and instructions
   */
  generateTransactionPackage(functionName, params, actionDescription) {
    try {
      const tx = this.createTransaction(functionName, params);
      const link = this.createMetaMaskLink(tx);
      
      const instructions = `
## ${actionDescription}

I've prepared the blockchain transaction for you. To proceed:

1. Make sure MetaMask is installed and connected to Sepolia testnet
2. Click this link to open the transaction in MetaMask:
   [${actionDescription}](${link})
3. Review the transaction details in MetaMask
4. Click "Confirm" to submit the transaction

Transaction details:
- Contract: ${this.contractAddress}
- Function: ${functionName}
- Chain ID: ${this.chainId} (Sepolia Testnet)
- Gas limit: ${parseInt(tx.gas, 16)}
`;
      
      return {
        transaction: tx,
        link: link,
        instructions: instructions,
        rawData: tx.data
      };
    } catch (error) {
      console.error("Error generating transaction package:", error);
      throw new Error(`Failed to generate transaction package: ${error.message}`);
    }
  }
}

// DocumentRegistry ABI (just the functions we need)
const DOCUMENT_REGISTRY_ABI = [
  {
    "inputs": [
      {"internalType": "bytes32", "name": "_documentHash", "type": "bytes32"},
      {"internalType": "string", "name": "_documentType", "type": "string"},
      {"internalType": "string", "name": "_metadata", "type": "string"}
    ],
    "name": "registerDocument",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "_documentId", "type": "bytes32"},
      {"internalType": "bytes32", "name": "_documentHash", "type": "bytes32"}
    ],
    "name": "verifyDocument",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

module.exports = {
  DirectTransactionHelper,
  DOCUMENT_REGISTRY_ABI
};