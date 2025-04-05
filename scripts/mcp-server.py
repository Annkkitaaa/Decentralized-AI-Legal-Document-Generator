# mcp-server.py
from mcp.server.fastmcp import FastMCP
import os
import json
import subprocess
import sys
import traceback

# Initialize FastMCP server
try:
    print("Starting MCP server for ethereum-legal-docs...", file=sys.stderr)
    mcp = FastMCP("ethereum-legal-docs")

    @mcp.tool()
    async def generate_legal_document(document_type: str, requirements: str) -> str:
        """Generate a legal document and register it on Ethereum blockchain.
        
        Args:
            document_type: Type of legal document (e.g., NDA, Employment Contract)
            requirements: Detailed requirements for the document
        """
        try:
            print(f"Generating document: {document_type}", file=sys.stderr)
            # Write content to file first
            with open("temp_req.txt", "w") as f:
                f.write(requirements)
                
            # Run the document generation script
            result = subprocess.run(
                ["npx", "hardhat", "run", "scripts/register-document.js", "--network", "sepolia", 
                 "temp_req.txt", document_type, "Generated via MCP"],
                capture_output=True,
                text=True,
                check=False  # Don't raise exception to handle errors more gracefully
            )
            
            # Clean up
            os.remove("temp_req.txt")
            
            if result.returncode != 0:
                print(f"Error in script: {result.stderr}", file=sys.stderr)
                return f"Error generating document: {result.stderr}"
            
            return result.stdout
        except Exception as e:
            print(f"Exception in generate_legal_document: {str(e)}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            return f"Error generating document: {str(e)}"

    @mcp.tool()
    async def verify_document(document_id: str, document_content: str) -> str:
        """Verify a document's authenticity on the Ethereum blockchain.
        
        Args:
            document_id: ID of the document to verify
            document_content: Content of the document to verify
        """
        try:
            print(f"Verifying document: {document_id}", file=sys.stderr)
            # Save document content to a temporary file
            with open("temp_doc.txt", "w") as f:
                f.write(document_content)
            
            # Run the verification script
            result = subprocess.run(
                ["npx", "hardhat", "run", "scripts/verify-document.js", "--network", "sepolia", 
                 document_id, "temp_doc.txt"],
                capture_output=True,
                text=True,
                check=False  # Don't raise exception
            )
            
            # Clean up
            os.remove("temp_doc.txt")
            
            if result.returncode != 0:
                print(f"Error in script: {result.stderr}", file=sys.stderr)
                return f"Error verifying document: {result.stderr}"
            
            return result.stdout
        except Exception as e:
            print(f"Exception in verify_document: {str(e)}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            return f"Error verifying document: {str(e)}"

    @mcp.tool()
    async def list_documents() -> str:
        """List all documents registered on the blockchain by the current user."""
        try:
            print("Listing documents", file=sys.stderr)
            result = subprocess.run(
                ["npx", "hardhat", "run", "scripts/get-user-documents.js", "--network", "sepolia"],
                capture_output=True,
                text=True,
                check=False
            )
            
            if result.returncode != 0:
                print(f"Error in script: {result.stderr}", file=sys.stderr)
                return f"Error listing documents: {result.stderr}"
            
            return result.stdout
        except Exception as e:
            print(f"Exception in list_documents: {str(e)}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            return f"Error listing documents: {str(e)}"

    print("Server initialized, starting...", file=sys.stderr)
    if __name__ == "__main__":
        # Initialize and run the server
        mcp.run(transport='stdio')
        
except Exception as e:
    print(f"Fatal error initializing MCP server: {str(e)}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)