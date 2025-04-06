// contracts/MCPIntegration.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./DocumentRegistry.sol";
import "./interfaces/IMCP.sol";

contract MCPIntegration {
    DocumentRegistry public documentRegistry;
    IMCP public mcpOracle;
    
    struct DocumentRequest {
        address requester;
        string documentType;
        string requirements;
        uint256 timestamp;
        uint256 mcpRequestId;
        bytes32 documentId;
        bool fulfilled;
    }
    
    mapping(uint256 => DocumentRequest) public documentRequests;
    // Track MCP request IDs to our internal request IDs
    mapping(uint256 => uint256) public mcpToLocalRequestId;
    uint256 public nextRequestId = 1;
    
    event DocumentGenerationRequested(
        uint256 indexed requestId,
        address indexed requester,
        string documentType,
        uint256 mcpRequestId
    );
    
    event DocumentGenerationFulfilled(
        uint256 indexed requestId,
        address indexed requester,
        bytes32 documentId
    );
    
    // New event for when MCP Oracle returns a result
    event MCPResponseReceived(
        uint256 indexed requestId,
        uint256 indexed mcpRequestId,
        string response
    );
    
    constructor(address _documentRegistryAddress, address _mcpOracleAddress) {
        documentRegistry = DocumentRegistry(_documentRegistryAddress);
        mcpOracle = IMCP(_mcpOracleAddress);
    }
    
    function requestDocumentGeneration(
        string memory _documentType, 
        string memory _requirements
    ) public returns (uint256) {
        uint256 requestId = nextRequestId++;
        
        // Create MCP request to Claude
        string memory prompt = generateClaudePrompt(_documentType, _requirements);
        string memory parameters = '{"temperature": 0.7, "max_tokens": 4000}';
        
        uint256 mcpRequestId = mcpOracle.requestAIInteraction(
            "Anthropic", 
            "claude-3-sonnet-20240229", 
            prompt,
            parameters
        );
        
        // Store mapping from MCP request ID to our internal request ID
        mcpToLocalRequestId[mcpRequestId] = requestId;
        
        documentRequests[requestId] = DocumentRequest({
            requester: msg.sender,
            documentType: _documentType,
            requirements: _requirements,
            timestamp: block.timestamp,
            mcpRequestId: mcpRequestId,
            documentId: bytes32(0),
            fulfilled: false
        });
        
        emit DocumentGenerationRequested(requestId, msg.sender, _documentType, mcpRequestId);
        
        return requestId;
    }
    
    // Function to receive responses from MCP Oracle
    function receiveAIResponse(uint256 _mcpRequestId, string memory _response) public {
        // Only the MCP Oracle can call this
        require(msg.sender == address(mcpOracle), "Only MCP Oracle can call this");
        
        // Get our internal request ID from MCP request ID
        uint256 requestId = mcpToLocalRequestId[_mcpRequestId];
        require(requestId > 0, "Unknown MCP request");
        
        DocumentRequest storage request = documentRequests[requestId];
        require(!request.fulfilled, "Request already fulfilled");
        
        // Emit event with the response
        emit MCPResponseReceived(requestId, _mcpRequestId, _response);
    }
    
    // Modified to accept document content directly
    function fulfillDocumentRequest(
        uint256 _requestId,
        string memory _documentContent,
        string memory _metadata
    ) public {
        DocumentRequest storage request = documentRequests[_requestId];
        
        require(!request.fulfilled, "Request already fulfilled");
        require(request.requester == msg.sender, "Not authorized");
        
        // Calculate document hash from content
        bytes32 _documentHash = keccak256(abi.encodePacked(_documentContent));
        
        bytes32 documentId = documentRegistry.registerDocument(
            _documentHash,
            request.documentType,
            _metadata
        );
        
        request.documentId = documentId;
        request.fulfilled = true;
        
        emit DocumentGenerationFulfilled(_requestId, msg.sender, documentId);
    }
    
    function getRequestDetails(uint256 _requestId) public view returns (
        address requester,
        string memory documentType,
        string memory requirements,
        uint256 timestamp,
        uint256 mcpRequestId,
        bytes32 documentId,
        bool fulfilled
    ) {
        DocumentRequest memory request = documentRequests[_requestId];
        
        // Only requester can see full details
        if (request.requester != msg.sender) {
            return (
                request.requester,
                request.documentType,
                "",
                request.timestamp,
                request.mcpRequestId,
                request.documentId,
                request.fulfilled
            );
        }
        
        return (
            request.requester,
            request.documentType,
            request.requirements,
            request.timestamp,
            request.mcpRequestId,
            request.documentId,
            request.fulfilled
        );
    }
    
    // Helper function to generate Claude prompt
    function generateClaudePrompt(
        string memory _documentType,
        string memory _requirements
    ) internal pure returns (string memory) {
        return string(abi.encodePacked(
            "You are an AI legal document assistant. Please create a professional ",
            _documentType,
            " document based on the following requirements: ",
            _requirements,
            ". Format the document professionally with proper legal language and structure."
        ));
    }
}