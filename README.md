# Decentralized AI Legal Document Generator

A blockchain-based legal document generation system that leverages Claude's AI capabilities combined with Ethereum for document verification and integrity. This project uniquely uses Claude itself as the primary interface, eliminating the need for custom frontend development while maintaining robust blockchain integration.

## Features

- **AI-Powered Document Creation** - Generate customized legal documents through natural conversation with Claude
- **Blockchain Verification** - Store document hashes on Ethereum for immutability and verification
- **No Custom Frontend Needed** - Use Claude as both the AI backend and user interface
- **MetaMask Integration** - Simple wallet connection for blockchain transactions
- **Testnet Deployment** - Built on Ethereum testnets (Sepolia/Goerli) for cost-free development

## Architecture

### Components

1. **Claude Interface Layer**
   - Handles natural language conversations for document requirements
   - Generates legal document content based on user specifications
   - Guides users through blockchain interactions
   - Provides document export options

2. **Smart Contracts**
   - Document Registry: Stores document metadata and verification hashes
   - MCP Integration: Connects with Claude via Model Context Protocol
   - Access Control: Manages permissions and document ownership

3. **MetaMask Integration**
   - Wallet connection for transaction signing
   - Testnet ETH management
   - User authentication via wallet address

## Project Structure
```
decentralized-ai-legal-document-generator/
├── contracts/
│   ├── DocumentRegistry.sol
│   ├── MCPIntegration.sol
│   ├── MockMCP.sol
│   └── interfaces/
│       └── IMCP.sol
├── scripts/
│   ├── deploy.js
│   ├── register-document.js
│   ├── verify-document.js
│   ├── get-user-documents.js
│   ├── get-document-content.js
│   └── DirectRegistration.js
├── test/
│   ├── DocumentRegistry.test.js
│   └── MCPIntegration.test.js
├── utils/
│   ├── document-hash.js
│   ├── claude-prompts.js
│   ├── Web3Provider.js
│   ├── document-verification.js
│   └── Direct-Transaction-Helper.js
├── docs/
│   ├── user-guide.md
│   ├── error-handling.md
│   ├── security.md
│   └── roadmap.md
├── .env
├── .env.example
├── hardhat.config.js
├── package.json
└── README.md
```

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/Annkkitaaa/decentralized-ai-legal-document-generator.git
   cd decentralized-ai-legal-document-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your own values
   ```

4. **Compile contracts**
   ```bash
   npx hardhat compile
   ```

5. **Deploy to testnet**
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

## Usage

### Document Creation and Registration

1. Engage with Claude to create your legal document
2. Follow Claude's prompts to provide document requirements
3. Review and refine the generated document
4. When satisfied, tell Claude you'd like to register the document on the blockchain
5. Claude will:
   - Guide you through connecting MetaMask to Sepolia testnet
   - Provide a complete transaction for you to approve in MetaMask
   - Calculate the document hash automatically
6. Simply approve the transaction in MetaMask when prompted
7. Claude will confirm the registration and provide the Document ID for future verification

### Document Verification

Verify the authenticity of a document:
```bash
npm run verify-doc YOUR_DOCUMENT_ID path/to/document.txt
```

### Viewing Your Documents

List all documents you've registered:
```bash
npm run list-docs
```

## Example Claude Conversations

See the `docs/user-guide.md` file for detailed examples of how to interact with Claude to create:
- Non-Disclosure Agreements
- Employment Contracts
- Service Agreements
- And more...

## Security Considerations

This system provides document verification, not legal advice. Always consult with a qualified legal professional before using generated documents for important matters.

See `docs/security.md` for detailed security information.

## Testing

Run the test suite:
```bash
npm test
```

## Future Development

See `docs/roadmap.md` for planned improvements including:
- Additional document templates
- Multi-party signing capabilities
- Enhanced AI-blockchain integration
- Cross-chain compatibility

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Anthropic for Claude AI capabilities
- Ethereum Foundation for blockchain infrastructure
- MCP developers for the Model Context Protocol standard
