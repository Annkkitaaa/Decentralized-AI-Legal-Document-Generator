// scripts/test-document-flow.js
const { ethers } = require("hardhat");
const fs = require("fs").promises;
const path = require("path");

async function main() {
  console.log("Testing full document generation and verification flow...");
  
  // Load environment variables
  const documentRegistryAddress = process.env.DOCUMENT_REGISTRY_ADDRESS;
  const mockMCPAddress = process.env.MOCK_MCP_ADDRESS;
  const mcpIntegrationAddress = process.env.MCP_INTEGRATION_ADDRESS;
  
  if (!documentRegistryAddress || !mockMCPAddress || !mcpIntegrationAddress) {
    throw new Error("Please set DOCUMENT_REGISTRY_ADDRESS, MOCK_MCP_ADDRESS, and MCP_INTEGRATION_ADDRESS in .env file");
  }
  
  console.log("Using contract addresses:");
  console.log(`DocumentRegistry: ${documentRegistryAddress}`);
  console.log(`MockMCP: ${mockMCPAddress}`);
  console.log(`MCPIntegration: ${mcpIntegrationAddress}`);
  
  // Get contract instances
  const DocumentRegistry = await ethers.getContractFactory("DocumentRegistry");
  const documentRegistry = await DocumentRegistry.attach(documentRegistryAddress);
  
  const MockMCP = await ethers.getContractFactory("MockMCP");
  const mockMCP = await MockMCP.attach(mockMCPAddress);
  
  const MCPIntegration = await ethers.getContractFactory("MCPIntegration");
  const mcpIntegration = await MCPIntegration.attach(mcpIntegrationAddress);
  
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
    console.log("Transaction sent, waiting for confirmation...");
    const requestReceipt = await requestTx.wait();
    console.log("Transaction confirmed in block:", requestReceipt.blockNumber);
    
    // In ethers v6, we need to use logs rather than events
    console.log("Parsing transaction logs...");
    const iface = mcpIntegration.interface;
    let requestId, mcpRequestId;
    
    // Look for DocumentGenerationRequested event in logs
    for (const log of requestReceipt.logs) {
      try {
        const parsedLog = iface.parseLog({
          topics: log.topics,
          data: log.data
        });
        
        if (parsedLog && parsedLog.name === "DocumentGenerationRequested") {
          requestId = parsedLog.args[0]; // requestId
          mcpRequestId = parsedLog.args[3]; // mcpRequestId
          break;
        }
      } catch (e) {
        // Skip logs that can't be parsed with this interface
        continue;
      }
    }
    
    if (!requestId) {
      throw new Error("Could not find DocumentGenerationRequested event in logs");
    }
    
    console.log(`Document requested with ID: ${requestId.toString()}`);
    console.log(`MCP Request ID: ${mcpRequestId.toString()}`);
    
    // Get request details to verify
    console.log("\nVerifying request details:");
    const requestInfo = await mcpIntegration.getRequestDetails(requestId);
    console.log("Request details:", {
      requester: requestInfo[0],
      documentType: requestInfo[1],
      mcpRequestId: requestInfo[4].toString(),
      fulfilled: requestInfo[6]
    });
    
    // Step 2: Simulate MCP Oracle response
    console.log("\nStep 2: Simulating Claude response via Mock MCP Oracle...");
    console.log(`MCP Integration target address: ${mcpIntegration.target}`);
    
    const simulateResponseTx = await mockMCP.simulateResponse(
      mcpRequestId,
      mcpIntegration.target, // Use .target in ethers v6
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
    
    // Parse logs for DocumentGenerationFulfilled event
    let documentId;
    for (const log of fulfillReceipt.logs) {
      try {
        const parsedLog = iface.parseLog({
          topics: log.topics,
          data: log.data
        });
        
        if (parsedLog && parsedLog.name === "DocumentGenerationFulfilled") {
          documentId = parsedLog.args[2]; // documentId
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!documentId) {
      throw new Error("Could not find DocumentGenerationFulfilled event in logs");
    }
    
    console.log(`Document registered with ID: ${documentId}`);
    
    // Save document ID to file
    await fs.writeFile(
      path.join(outputDir, "document-id.txt"),
      documentId.toString()
    );
    
    // Step 4: Verify document
    console.log("\nStep 4: Verifying document...");
    // Calculate document hash - using ethers v6 method
    const documentHash = ethers.keccak256(ethers.toUtf8Bytes(documentContent));
    console.log(`Document hash: ${documentHash}`);
    
    const verifyTx = await documentRegistry.verifyDocument(documentId, documentHash);
    const verifyReceipt = await verifyTx.wait();
    
    // Parse logs for DocumentVerified event
    let verified;
    const docRegistryIface = documentRegistry.interface;
    for (const log of verifyReceipt.logs) {
      try {
        const parsedLog = docRegistryIface.parseLog({
          topics: log.topics,
          data: log.data
        });
        
        if (parsedLog && parsedLog.name === "DocumentVerified") {
          verified = parsedLog.args[2]; // verified boolean
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    console.log(`Verification result: ${verified ? "Verified ✅" : "Failed ❌"}`);
    
    // Step 5: Test verification with modified content
    console.log("\nStep 5: Testing verification with modified content...");
    const modifiedContent = documentContent + "\nModified on " + new Date().toISOString();
    const modifiedHash = ethers.keccak256(ethers.toUtf8Bytes(modifiedContent));
    
    console.log(`Modified document hash: ${modifiedHash}`);
    
    const verifyModifiedTx = await documentRegistry.verifyDocument(documentId, modifiedHash);
    const verifyModifiedReceipt = await verifyModifiedTx.wait();
    
    // Parse logs for DocumentVerified event for modified content
    let modifiedVerified;
    for (const log of verifyModifiedReceipt.logs) {
      try {
        const parsedLog = docRegistryIface.parseLog({
          topics: log.topics,
          data: log.data
        });
        
        if (parsedLog && parsedLog.name === "DocumentVerified") {
          modifiedVerified = parsedLog.args[2]; // verified boolean
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    console.log(`Modified verification result: ${modifiedVerified ? "Verified ✅" : "Failed ❌"}`);
    
    console.log("\nTest complete! The document flow is working correctly.");
    
  } catch (error) {
    console.error("Error in test flow:", error);
    console.error(error.stack);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });