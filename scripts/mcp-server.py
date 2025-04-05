# mcp_server.py
from mcp.server.fastmcp import FastMCP, Context
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator
from dataclasses import dataclass
import os
from web3 import Web3
from dotenv import load_dotenv
import hashlib

# Load environment variables
load_dotenv()

# Server context class - similar to ServerContext in JS example
@dataclass
class BlockchainContext:
    provider: Web3
    wallet_address: str
    mcp_integration_contract: any
    document_registry_contract: any

@asynccontextmanager
async def app_lifespan(server: FastMCP) -> AsyncIterator[BlockchainContext]:
    """Manage application lifecycle with blockchain connections"""
    # Initialize on startup
    print("[ethereum-legal-docs] [info] Initializing blockchain connections...")
    
    try:
        # Load contract addresses from environment
        DOCUMENT_REGISTRY_ADDRESS = os.getenv("DOCUMENT_REGISTRY_ADDRESS")
        MCP_INTEGRATION_ADDRESS = os.getenv("MCP_INTEGRATION_ADDRESS")
        
        if not DOCUMENT_REGISTRY_ADDRESS or not MCP_INTEGRATION_ADDRESS:
            raise ValueError("Missing contract addresses in environment variables")
        
        # Initialize provider
        provider = Web3(Web3.HTTPProvider(os.getenv("SEPOLIA_RPC_URL")))
        
        # Initialize wallet
        PRIVATE_KEY = os.getenv("PRIVATE_KEY")
        if not PRIVATE_KEY:
            raise ValueError("Missing private key in environment variables")
        
        account = provider.eth.account.from_key(PRIVATE_KEY)
        wallet_address = account.address
        
        # Initialize contract connections
        mcp_integration_abi = [
            {"inputs": [{"type": "string"}, {"type": "string"}], "name": "requestDocumentGeneration", "outputs": [{"type": "uint256"}], "stateMutability": "nonpayable", "type": "function"},
            {"inputs": [{"type": "uint256"}, {"type": "bytes32"}, {"type": "string"}], "name": "fulfillDocumentRequest", "outputs": [], "stateMutability": "nonpayable", "type": "function"}
        ]
        
        document_registry_abi = [
            {"inputs": [{"type": "bytes32"}, {"type": "bytes32"}], "name": "verifyDocument", "outputs": [{"type": "bool"}], "stateMutability": "view", "type": "function"},
            {"inputs": [{"type": "bytes32"}, {"type": "bytes32"}], "name": "registerDocument", "outputs": [{"type": "bool"}], "stateMutability": "nonpayable", "type": "function"}
        ]
        
        mcp_integration_contract = provider.eth.contract(
            address=MCP_INTEGRATION_ADDRESS,
            abi=mcp_integration_abi
        )
        
        document_registry_contract = provider.eth.contract(
            address=DOCUMENT_REGISTRY_ADDRESS,
            abi=document_registry_abi
        )
        
        # Create context
        context = BlockchainContext(
            provider=provider,
            wallet_address=wallet_address,
            mcp_integration_contract=mcp_integration_contract,
            document_registry_contract=document_registry_contract
        )
        
        print("[ethereum-legal-docs] [info] Blockchain connections initialized successfully")
        yield context
        
    except Exception as e:
        print(f"[ethereum-legal-docs] [error] Failed to initialize: {str(e)}")
        raise
    finally:
        # Cleanup on shutdown
        print("[ethereum-legal-docs] [info] Shutting down connections...")

# Create MCP server with name and dependencies
server = FastMCP("ethereum-legal-docs", dependencies=["web3", "python-dotenv"])

# Set up lifespan
server.lifespan = app_lifespan

@server.tool()
async def generate_legal_document(document_type: str, requirements: str, ctx: Context) -> dict:
    """Generate a legal document and register it on Ethereum blockchain
    
    Args:
        document_type: Type of legal document (e.g., NDA, Employment Contract)
        requirements: Detailed requirements for the document
    """
    try:
        # Access context (similar to server.context in JS)
        blockchain_ctx = ctx.request_context.lifespan_context
        mcp_integration = blockchain_ctx.mcp_integration_contract
        
        # Log the request
        print(f"[ethereum-legal-docs] [info] Generating {document_type} document")
        
        # Request document generation from contract
        # Note: In a real implementation you'd handle the transaction signing
        # This is simplified for clarity
        transaction = {
            'from': blockchain_ctx.wallet_address,
            'nonce': blockchain_ctx.provider.eth.get_transaction_count(blockchain_ctx.wallet_address),
            'gas': 2000000,
            'gasPrice': blockchain_ctx.provider.eth.gas_price
        }
        
        tx_hash = mcp_integration.functions.requestDocumentGeneration(
            document_type, 
            requirements
        ).transact(transaction)
        
        # Wait for transaction receipt
        receipt = blockchain_ctx.provider.eth.wait_for_transaction_receipt(tx_hash)
        
        # In a real implementation, you'd need to parse events properly
        # This is simplified for clarity
        request_id = "123456"  # In reality, you'd extract this from the event
        
        print(f"[ethereum-legal-docs] [info] Document request submitted with ID: {request_id}")
        
        return {
            "success": True,
            "requestId": request_id,
            "message": f"Document generation request submitted. Request ID: {request_id}"
        }
    except Exception as e:
        print(f"[ethereum-legal-docs] [error] {str(e)}")
        
        return {
            "success": False,
            "message": f"Error generating document: {str(e)}"
        }

@server.tool()
async def verify_document(document_id: str, document_content: str, ctx: Context) -> dict:
    """Verify a document's authenticity on the Ethereum blockchain
    
    Args:
        document_id: ID of the document to verify
        document_content: Content of the document to verify
    """
    try:
        # Access context
        blockchain_ctx = ctx.request_context.lifespan_context
        document_registry = blockchain_ctx.document_registry_contract
        
        # Calculate document hash
        document_hash = Web3.keccak(text=document_content).hex()
        
        # Convert document ID to bytes32 if needed
        if document_id.startswith("0x"):
            formatted_document_id = document_id
        else:
            # Convert to bytes32
            padded_bytes = document_id.encode().ljust(32, b'\0')
            formatted_document_id = "0x" + padded_bytes.hex()
        
        # Verify document
        # Note: In a real implementation you'd handle the transaction properly
        # This is simplified for clarity
        verified = document_registry.functions.verifyDocument(
            formatted_document_id,
            document_hash
        ).call()
        
        print(f"[ethereum-legal-docs] [info] Document verification result: {verified}")
        
        return {
            "success": True,
            "verified": verified,
            "message": "Document is authentic and unaltered." if verified else 
                      "Document verification failed. The document may have been altered."
        }
    except Exception as e:
        print(f"[ethereum-legal-docs] [error] {str(e)}")
        
        return {
            "success": False,
            "message": f"Error verifying document: {str(e)}"
        }

if __name__ == "__main__":
    server.run()