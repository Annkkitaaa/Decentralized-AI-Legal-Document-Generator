// scripts/test-document-flow.js
const { ethers } = require("hardhat");
const fs = require("fs").promises;
const path = require("path");
const { calculateDocumentHash } = require("../utils/document-hash");

async function main() {
  console.log("Testing full document generation and verification flow...");
  
  // Get contract instances
  const DocumentRegistry = await ethers.getContractFactory("DocumentRegistry");
  const documentRegistry = await DocumentRegistry.deploy();
  await documentRegistry.deployed();
  console.log(`DocumentRegistry deployed to: ${documentRegistry.address}`);
  
  const MockMCP = await ethers.getContractFactory("MockMCP");
  const mockMCP = await MockMCP.deploy();
  await mockMCP.deployed();
  console.log(`MockMCP deployed to: ${mockMCP.address}`);
  
  const MCPIntegration = await ethers.getContractFactory("MCPIntegration");
  const mcpIntegration = await MCPIntegration.deploy(documentRegistry.address, mockMCP.address);
  await mcpIntegration.deployed();
  console.log(`MCPIntegration deployed to: ${mcpIntegration.address}`);
  
  // Sample document
  const documentType = "Non-Disclosure Agreement";
  const requirements = "NDA between ACME Corp and John Doe for Project X. Confidentiality period of 2 years.";
  const documentContent = `
NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement (the "Agreement") is entered into as of the Effective Date below, by and between:

ACME Corp, a corporation with its principal place of business at 123 Main Street, Anytown, USA ("Company")

and

John Doe, an individual residing at 456 Oak Avenue, Somewhere, USA ("Recipient")

1. CONFIDENTIAL INFORMATION
For purposes of this Agreement, "Confidential Information" shall mean any and all information related to Project X that is disclosed to Recipient by Company, either directly or indirectly, in writing, orally or by inspection of tangible objects.

2. TERM
The obligations of Recipient under this Agreement shall survive for a period of 2 years from the Effective Date.

3. EFFECTIVE DATE
This Agreement is effective as of April 6, 2025.

COMPANY:                          RECIPIENT:
ACME Corp                         John Doe

___________________               ___________________
Signature                         Signature
`;
  
  // Create the output directory for test artifacts
  const outputDir = path.join(__dirname, "..", "test-output");
  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch (err) {
    console.log("Output directory already exists");
  }
  
  // Save the document content to file
  const documentPath = path.join(outputDir, "test-document.txt");
  await fs.writeFile(documentPath, documentContent);
  console.log(`Sample document saved to: ${documentPath}`);
  
  try {
    // Step 1: Request document generation
    console.log("\nStep 1: Requesting document generation...");
    const requestTx = await mcpIntegration.requestDocumentGeneration(
      documentType,
      requirements
    );
    const requestReceipt = await requestTx.wait();
    
    // Get the request ID from event
    const requestEvent = requestReceipt.events.find(e => e.event === "DocumentGenerationRequested");
    const requestId = requestEvent.args.requestId;
    const mcpRequestId = requestEvent.args.mcpRequestId;
    console.log(`Document requested with ID: ${requestId.toString()}`);
    console.log(`MCP Request ID: ${mcpRequestId.toString()}`);
    
    // Step 2: Simulate MCP Oracle response
    console.log("\nStep 2: Simulating Claude response via Mock MCP Oracle...");
    const simulateResponseTx = await mockMCP.simulateResponse(
      mcpRequestId,
      mcpIntegration.address,
      documentContent
    );
    await simulateResponseTx.wait();
    console.log("Claude response simulated");
    
    // Step 3: Fulfill document request
    console.log("\nStep 3: Fulfilling document request...");
    const fulfillTx = await mcpIntegration.fulfillDocumentRequest(
      requestId,
      documentContent,
      "Generated via Claude MCP"
    );
    const fulfillReceipt = await fulfillTx.wait();
    
    // Get the document ID from event
    const fulfillEvent = fulfillReceipt.events.find(e => e.event === "DocumentGenerationFulfilled");
    const documentId = fulfillEvent.args.documentId;
    console.log(`Document registered with ID: ${documentId}`);
    
    // Save document ID to file
    await fs.writeFile(
      path.join(outputDir, "document-id.txt"),
      documentId
    );
    
    // Step 4: Verify document
    console.log("\nStep 4: Verifying document...");
    const hash = calculateDocumentHash(documentContent);
    console.log(`Document hash: ${hash}`);
    
    const verifyTx = await documentRegistry.verifyDocument(documentId, hash);
    const verifyReceipt = await verifyTx.wait();
    
    const verifyEvent = verifyReceipt.events.find(e => e.event === "DocumentVerified");
    const verified = verifyEvent.args.verified;
    
    console.log(`Verification result: ${verified ? "Verified ✅" : "Failed ❌"}`);
    
    // Step 5: Test verification with modified content
    console.log("\nStep 5: Testing verification with modified content...");
    const modifiedContent = documentContent + "\nModified on " + new Date().toISOString();
    const modifiedHash = calculateDocumentHash(modifiedContent);
    
    console.log(`Modified document hash: ${modifiedHash}`);
    
    const verifyModifiedTx = await documentRegistry.verifyDocument(documentId, modifiedHash);
    const verifyModifiedReceipt = await verifyModifiedTx.wait();
    
    const verifyModifiedEvent = verifyModifiedReceipt.events.find(e => e.event === "DocumentVerified");
    const modifiedVerified = verifyModifiedEvent.args.verified;
    
    console.log(`Modified verification result: ${modifiedVerified ? "Verified ✅" : "Failed ❌"}`);
    
    console.log("\nTest complete! The document flow is working correctly.");
    
  } catch (error) {
    console.error("Error in test flow:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });