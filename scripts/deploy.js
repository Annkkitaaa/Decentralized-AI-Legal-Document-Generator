// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  // Deploy Document Registry
  const DocumentRegistry = await hre.ethers.getContractFactory("DocumentRegistry");
  const documentRegistry = await DocumentRegistry.deploy();
  await documentRegistry.deployed();
  console.log(`DocumentRegistry deployed to: ${documentRegistry.address}`);

  // For testing purposes, deploy a mock MCP Oracle
  // In a real implementation, you would use the actual MCP Oracle address
  const MockMCP = await hre.ethers.getContractFactory("MockMCP");
  const mockMCP = await MockMCP.deploy();
  await mockMCP.deployed();
  console.log(`Mock MCP Oracle deployed to: ${mockMCP.address}`);

  // Deploy MCP Integration with Document Registry and Mock MCP Oracle addresses
  const MCPIntegration = await hre.ethers.getContractFactory("MCPIntegration");
  const mcpIntegration = await MCPIntegration.deploy(
    documentRegistry.address,
    mockMCP.address
  );
  await mcpIntegration.deployed();
  console.log(`MCPIntegration deployed to: ${mcpIntegration.address}`);

  console.log("Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });