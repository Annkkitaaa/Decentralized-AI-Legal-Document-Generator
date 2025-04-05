// scripts/get-user-documents.js
const hre = require("hardhat");

async function main() {
  try {
    // Get contract instance
    const documentRegistryAddress = process.env.DOCUMENT_REGISTRY_ADDRESS;
    const DocumentRegistry = await hre.ethers.getContractFactory("DocumentRegistry");
    const documentRegistry = DocumentRegistry.attach(documentRegistryAddress);
    
    console.log("Fetching your registered documents...");
    
    // Get document IDs
    const documentIds = await documentRegistry.getUserDocuments();
    
    if (documentIds.length === 0) {
      console.log("You haven't registered any documents yet.");
      return;
    }
    
    console.log(`Found ${documentIds.length} documents:`);
    
    // Get details for each document
    for (let i = 0; i < documentIds.length; i++) {
      const documentId = documentIds[i];
      
      const document = await documentRegistry.getDocument(documentId);
      
      console.log(`\nDocument #${i+1}:`);
      console.log(`ID: ${documentId}`);
      console.log(`Type: ${document.documentType}`);
      console.log(`Registered at: ${new Date(document.timestamp.toNumber() * 1000).toLocaleString()}`);
      if (document.metadata) {
        console.log(`Metadata: ${document.metadata}`);
      }
    }
    
  } catch (error) {
    console.error("Error fetching documents:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });