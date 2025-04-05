// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  // Deploy Document Registry
  const DocumentRegistry = await hre.ethers.getContractFactory("DocumentRegistry");
  const documentRegistry = await DocumentRegistry.deploy();
  await documentRegistry.waitForDeployment();
  const documentRegistryAddress = await documentRegistry.getAddress();
  console.log(`DocumentRegistry deployed to: ${documentRegistryAddress}`);

  // For testing purposes, deploy a mock MCP Oracle
  const MockMCP = await hre.ethers.getContractFactory("MockMCP");
  const mockMCP = await MockMCP.deploy();
  await mockMCP.waitForDeployment();
  const mockMCPAddress = await mockMCP.getAddress();
  console.log(`Mock MCP Oracle deployed to: ${mockMCPAddress}`);

  // Deploy MCP Integration with Document Registry and Mock MCP Oracle addresses
  const MCPIntegration = await hre.ethers.getContractFactory("MCPIntegration");
  const mcpIntegration = await MCPIntegration.deploy(
    documentRegistryAddress,
    mockMCPAddress
  );
  await mcpIntegration.waitForDeployment();
  const mcpIntegrationAddress = await mcpIntegration.getAddress();
  console.log(`MCPIntegration deployed to: ${mcpIntegrationAddress}`);

  console.log("Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });