// scripts/get-document-content.js
const hre = require("hardhat");

async function main() {
  // Command line arguments
  const documentId = process.argv[2];
  
  if (!documentId) {
    console.error("Please provide document ID as argument");
    process.exit(1);
  }
  
  try {
    // Get contract instance
    const documentRegistryAddress = process.env.DOCUMENT_REGISTRY_ADDRESS;
    const DocumentRegistry = await hre.ethers.getContractFactory("DocumentRegistry");
    const documentRegistry = DocumentRegistry.attach(documentRegistryAddress);
    
    // Get document details
    const document = await documentRegistry.getDocument(documentId);
    
    console.log(`\nDocument Details:`);
    console.log(`ID: ${documentId}`);
    console.log(`Owner: ${document.owner}`);
    console.log(`Hash: ${document.documentHash}`);
    console.log(`Type: ${document.documentType}`);
    console.log(`Registered at: ${new Date(document.timestamp.toNumber() * 1000).toLocaleString()}`);
    console.log(`Metadata: ${document.metadata}`);
    
    console.log("\nNote: The actual document content is not stored on the blockchain.");
    console.log("This command only retrieves metadata and verification information.");
    
  } catch (error) {
    console.error("Error retrieving document:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });