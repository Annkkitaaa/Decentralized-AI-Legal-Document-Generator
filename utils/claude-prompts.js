// utils/claude-prompts.js

/**
 * Generates prompts for Claude to create different document types
 */
const documentPrompts = {
    nda: `
      Create a legally sound Non-Disclosure Agreement with the following details:
      
      - Party A: {partyA}
      - Party B: {partyB}
      - Purpose of disclosure: {purpose}
      - Duration of confidentiality: {duration}
      - Governing law: {governingLaw}
      
      Please format this as a professional legal document with appropriate clauses for:
      1. Definition of confidential information
      2. Exclusions from confidential information
      3. Obligations of the receiving party
      4. Term and termination
      5. Return of materials
      6. Remedies
      7. Miscellaneous provisions
    `,
    
    employmentContract: `
      Create a professional Employment Contract with the following details:
      
      - Employer: {employer}
      - Employee: {employee}
      - Position: {position}
      - Start date: {startDate}
      - Compensation: {compensation}
      - Benefits: {benefits}
      - Work hours: {workHours}
      - Termination conditions: {terminationConditions}
      
      Please format this as a professional legal document with appropriate clauses for:
      1. Duties and responsibilities
      2. Compensation and benefits
      3. Term of employment
      4. Confidentiality and non-compete
      5. Intellectual property
      6. Termination
      7. Governing law
      8. Miscellaneous provisions
    `,
    
    // Add more templates as needed
  };
  
  /**
   * Registration guidance prompt for Claude to use after document creation
   */
  const registrationPrompt = `
  Would you like to register this document on the Ethereum blockchain for verification purposes? 
  
  This will:
  - Create a cryptographic fingerprint (hash) of your document
  - Store this hash on the Ethereum blockchain
  - Enable you to verify the document's authenticity in the future
  
  You'll need:
  - MetaMask wallet extension installed in your browser
  - Connection to the Sepolia testnet
  - A small amount of test ETH (which you can get for free from a faucet)
  
  I can guide you through the registration process if you'd like to proceed.
  `;
  
  /**
   * MetaMask connection guidance for Claude
   */
  const metaMaskGuidance = `
  To connect MetaMask and register this document:
  
  1. Make sure you have the MetaMask browser extension installed
  2. Open MetaMask by clicking its icon in your browser toolbar
  3. Log in to your wallet if needed
  4. Connect to the Sepolia testnet:
     - Click the network dropdown at the top of MetaMask
     - Select "Sepolia Test Network"
  5. Ensure you have some test ETH (get from https://sepoliafaucet.com if needed)
  6. Once ready, I'll provide a transaction link that will open in MetaMask
  7. Review the transaction details and click "Confirm" to register your document
  `;
  
  /**
   * Transaction preparation guidance for Claude
   */
  const transactionPreparationPrompt = `
  I'm preparing the transaction data for registering your document on the blockchain.
  
  The document hash (its unique fingerprint) is:
  {documentHash}
  
  When you're ready, click the link below to submit the transaction through MetaMask:
  [Register Document on Ethereum](https://metamask.app.link/dapp/register?to={contractAddress}&data={transactionData})
  
  After approval, you'll receive a Transaction ID and Document ID to keep for your records.
  `;
  
  /**
   * Post-registration guidance for Claude
   */
  const postRegistrationPrompt = `
  Congratulations! Your document has been successfully registered on the Ethereum blockchain.
  
  Important information to save:
  - Document ID: {documentId}
  - Transaction Hash: {transactionHash}
  - Registration Date: {registrationDate}
  
  To verify this document in the future:
  1. Keep the original document content safe
  2. Use the Document ID above with a verification tool
  3. Any changes to the document will cause verification to fail
  
  Would you like me to explain how to verify this document in the future?
  `;
  
  /**
   * Fills in a template with the provided parameters
   * @param {string} template - The template string with placeholders
   * @param {Object} params - Object containing parameter values
   * @returns {string} - The filled template
   */
  function fillTemplate(template, params) {
    let result = template;
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    return result;
  }
  
  /**
   * Generates a Claude prompt for document creation
   * @param {string} documentType - The type of document to create
   * @param {Object} params - Parameters for the document
   * @returns {string} - The complete prompt for Claude
   */
  function generateDocumentPrompt(documentType, params) {
    const template = documentPrompts[documentType.toLowerCase()];
    if (!template) {
      return `Create a professional ${documentType} with the following details:\n\n${JSON.stringify(params, null, 2)}`;
    }
    
    return fillTemplate(template, params);
  }
  
  module.exports = {
    generateDocumentPrompt,
    documentPrompts,
    registrationPrompt,
    metaMaskGuidance,
    transactionPreparationPrompt,
    postRegistrationPrompt,
    fillTemplate
  };