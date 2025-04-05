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
   */
  constructor(contractAddress, contractABI) {
    this.contractAddress = contractAddress;
    this.contractABI = contractABI;
    this.interface = new ethers.utils.Interface(contractABI);
  }
  
  /**
   * Encodes a function call
   * @param {string} functionName - Name of the function
   * @param {Array} params - Parameters for the function
   * @returns {string} - Encoded function data
   */
  encodeFunctionData(functionName, params) {
    return this.interface.encodeFunctionData(functionName, params);
  }
  
  /**
   * Creates a transaction object
   * @param {string} functionName - Name of the function
   * @param {Array} params - Parameters for the function
   * @param {string} gas - Gas limit
   * @returns {Object} - Transaction object
   */
  createTransaction(functionName, params, gas = "100000") {
    const data = this.encodeFunctionData(functionName, params);
    
    return {
      to: this.contractAddress,
      data: data,
      gas: ethers.utils.hexlify(parseInt(gas)),
      value: "0x0"
    };
  }
  
  /**
   * Creates a MetaMask-compatible deep link
   * @param {Object} tx - Transaction object
   * @returns {string} - MetaMask deep link
   */
  createMetaMaskLink(tx) {
    const txParams = JSON.stringify(tx);
    const encodedParams = encodeURIComponent(txParams);
    
    return `ethereum:${this.contractAddress}?data=${tx.data}&gas=${tx.gas}`;
  }
  
  /**
   * Generates a complete transaction package for Claude to provide
   * @param {string} functionName - Contract function to call
   * @param {Array} params - Function parameters
   * @param {string} actionDescription - Description of the action
   * @returns {Object} - Transaction package with links and instructions
   */
  generateTransactionPackage(functionName, params, actionDescription) {
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
- Gas limit: ${parseInt(tx.gas, 16)}
`;
    
    return {
      transaction: tx,
      link: link,
      instructions: instructions,
      rawData: tx.data
    };
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