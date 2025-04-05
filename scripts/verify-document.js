// scripts/verify-document.js
const hre = require("hardhat");
const fs = require("fs").promises;
const { calculateDocumentHash } = require("../utils/document-hash");

async function main() {
  // Command line arguments
  const documentId = process.argv[2];
  const documentPath = process.argv[3];
  
  if (!documentId || !documentPath) {
    console.error("Please provide document ID and document path as arguments");
    process.exit(1);
  }
  
  try {
    // Read document content
    const documentContent = await fs.readFile(documentPath, "utf8");
    
    // Calculate document hash
    const documentHash = calculateDocumentHash(documentContent);
    console.log(`Document Hash: ${documentHash}`);
    
    // Get contract instance
    const documentRegistryAddress = process.env.DOCUMENT_REGISTRY_ADDRESS;
    const DocumentRegistry = await hre.ethers.getContractFactory("DocumentRegistry");
    const documentRegistry = DocumentRegistry.attach(documentRegistryAddress);
    
    // Verify document
    console.log("Verifying document...");
    const tx = await documentRegistry.verifyDocument(documentId, documentHash);
    const receipt = await tx.wait();
    
    // Find the DocumentVerified event
    const event = receipt.events.find(event => event.event === "DocumentVerified");
    const verified = event.args.verified;
    
    if (verified) {
      console.log("✅ Document verified successfully! The document is authentic.");
    } else {
      console.log("❌ Document verification failed! The document may have been altered.");
    }
    
    console.log(`Transaction Hash: ${receipt.transactionHash}`);
    
  } catch (error) {
    console.error("Error verifying document:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });