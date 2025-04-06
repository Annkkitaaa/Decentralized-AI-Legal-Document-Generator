// scripts/deploy.js
const hre = require('hardhat');

async function main() {
  console.log('Deploying contracts...');

  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  const DocumentRegistry = await hre.ethers.getContractFactory('DocumentRegistry');
  const documentRegistry = await DocumentRegistry.deploy();
  await documentRegistry.waitForDeployment();
  console.log('DocumentRegistry deployed to:', await documentRegistry.getAddress());

  const MockMCP = await hre.ethers.getContractFactory('MockMCP');
  const mockMCP = await MockMCP.deploy();
  await mockMCP.waitForDeployment();
  console.log('MockMCP deployed to:', await mockMCP.getAddress());

  const MCPIntegration = await hre.ethers.getContractFactory('MCPIntegration');
  const mcpIntegration = await MCPIntegration.deploy(
    await documentRegistry.getAddress(),
    await mockMCP.getAddress()
  );
  await mcpIntegration.waitForDeployment();
  console.log('MCPIntegration deployed to:', await mcpIntegration.getAddress());

  console.log('Deployment complete!');

  return {
    documentRegistry: await documentRegistry.getAddress(),
    mockMCP: await mockMCP.getAddress(),
    mcpIntegration: await mcpIntegration.getAddress()
  };
}

main()
  .then((addresses) => {
    console.log('\nAdd these addresses to your .env file:');
    console.log(`DOCUMENT_REGISTRY_ADDRESS=${addresses.documentRegistry}`);
    console.log(`MOCK_MCP_ADDRESS=${addresses.mockMCP}`);
    console.log(`MCP_INTEGRATION_ADDRESS=${addresses.mcpIntegration}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
