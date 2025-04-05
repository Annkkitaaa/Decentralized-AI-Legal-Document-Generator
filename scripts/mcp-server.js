// scripts/mcp-server.js
import { createServer } from 'mcp';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Load contract addresses from environment
const DOCUMENT_REGISTRY_ADDRESS = process.env.DOCUMENT_REGISTRY_ADDRESS;
const MCP_INTEGRATION_ADDRESS = process.env.MCP_INTEGRATION_ADDRESS;

// Initialize provider and contract connections
const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const mcpIntegration = new ethers.Contract(
  MCP_INTEGRATION_ADDRESS,
  [
    "function requestDocumentGeneration(string memory, string memory) public returns (uint256)",
    "function fulfillDocumentRequest(uint256, bytes32, string memory) public"
  ],
  wallet
);

// Create MCP server
const server = createServer("ethereum-legal-docs");

// Register document generation tool
server.tool({
  name: "generate-legal-document",
  description: "Generate a legal document and register it on Ethereum blockchain",
  parameters: {
    type: "object",
    properties: {
      documentType: {
        type: "string",
        description: "Type of legal document (e.g., NDA, Employment Contract)"
      },
      requirements: {
        type: "string",
        description: "Detailed requirements for the document"
      }
    },
    required: ["documentType", "requirements"]
  },
  execute: async function({ documentType, requirements }) {
    try {
      // Request document generation from contract
      const tx = await mcpIntegration.requestDocumentGeneration(documentType, requirements);
      const receipt = await tx.wait();
      
      // Find the event with request ID
      const event = receipt.events.find(e => e.event === "DocumentGenerationRequested");
      const requestId = event.args.requestId.toString();
      
      return {
        success: true,
        requestId: requestId,
        message: `Document generation request submitted. Request ID: ${requestId}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Error generating document: ${error.message}`
      };
    }
  }
});

// Register document verification tool
server.tool({
  name: "verify-document",
  description: "Verify a document's authenticity on the Ethereum blockchain",
  parameters: {
    type: "object",
    properties: {
      documentId: {
        type: "string",
        description: "ID of the document to verify"
      },
      documentContent: {
        type: "string",
        description: "Content of the document to verify"
      }
    },
    required: ["documentId", "documentContent"]
  },
  execute: async function({ documentId, documentContent }) {
    try {
      // Calculate document hash
      const documentHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(documentContent)
      );
      
      // Create contract instance for verification
      const documentRegistry = new ethers.Contract(
        DOCUMENT_REGISTRY_ADDRESS,
        ["function verifyDocument(bytes32, bytes32) public returns (bool)"],
        wallet
      );
      
      // Verify document
      const tx = await documentRegistry.verifyDocument(documentId, documentHash);
      const receipt = await tx.wait();
      
      // Check verification result
      const event = receipt.events.find(e => e.event === "DocumentVerified");
      const verified = event.args.verified;
      
      return {
        success: true,
        verified: verified,
        message: verified ? 
          "Document is authentic and unaltered." : 
          "Document verification failed. The document may have been altered."
      };
    } catch (error) {
      return {
        success: false,
        message: `Error verifying document: ${error.message}`
      };
    }
  }
});

// Start the server
server.start();