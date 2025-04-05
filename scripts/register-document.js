// scripts/register-document.js
const hre = require("hardhat");
const fs = require("fs").promises;
const { calculateDocumentHash } = require("../utils/document-hash");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  
  // Command line arguments
  const documentPath = process.argv[2];
  const documentType = process.argv[3] || "Generic Document";
  const metadata = process.argv[4] || "";
  
  if (!documentPath) {
    console.error("Please provide a document path as the first argument");
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
    
    // Register document
    console.log("Registering document on blockchain...");
    const tx = await documentRegistry.registerDocument(
      documentHash,
      documentType,
      metadata
    );
    
    const receipt = await tx.wait();
    
    // Find the DocumentRegistered event
    const event = receipt.events.find(event => event.event === "DocumentRegistered");
    const documentId = event.args.documentId;
    
    console.log(`Document registered successfully!`);
    console.log(`Document ID: ${documentId}`);
    console.log(`Transaction Hash: ${receipt.transactionHash}`);
    
  } catch (error) {
    console.error("Error registering document:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });