// contracts/DocumentRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract DocumentRegistry {
    struct Document {
        address owner;
        bytes32 documentHash;
        uint256 timestamp;
        string documentType;
        string metadata;
        bool exists;
    }
    
    mapping(bytes32 => Document) public documents;
    mapping(address => bytes32[]) public userDocuments;
    
    event DocumentRegistered(
        address indexed owner,
        bytes32 indexed documentId, 
        bytes32 documentHash, 
        string documentType
    );
    
    event DocumentVerified(
        bytes32 indexed documentId,
        bytes32 documentHash,
        bool verified
    );
    
    function registerDocument(
        bytes32 _documentHash, 
        string memory _documentType, 
        string memory _metadata
    ) public returns (bytes32) {
        bytes32 documentId = keccak256(abi.encodePacked(_documentHash, msg.sender, block.timestamp));
        
        documents[documentId] = Document({
            owner: msg.sender,
            documentHash: _documentHash,
            timestamp: block.timestamp,
            documentType: _documentType,
            metadata: _metadata,
            exists: true
        });
        
        userDocuments[msg.sender].push(documentId);
        
        emit DocumentRegistered(msg.sender, documentId, _documentHash, _documentType);
        
        return documentId;
    }
    
    function getUserDocuments() public view returns (bytes32[] memory) {
        return userDocuments[msg.sender];
    }
    
    function getDocument(bytes32 _documentId) public view returns (
        address owner,
        bytes32 documentHash,
        uint256 timestamp,
        string memory documentType,
        string memory metadata
    ) {
        Document memory doc = documents[_documentId];
        require(doc.exists, "Document does not exist");
        
        // Anyone can view document metadata, but only owner can see full details
        if (doc.owner != msg.sender) {
            return (doc.owner, bytes32(0), doc.timestamp, doc.documentType, "");
        }
        
        return (doc.owner, doc.documentHash, doc.timestamp, doc.documentType, doc.metadata);
    }
    
    function verifyDocument(bytes32 _documentId, bytes32 _documentHash) public returns (bool) {
        Document memory doc = documents[_documentId];
        require(doc.exists, "Document does not exist");
        
        bool verified = doc.documentHash == _documentHash;
        
        emit DocumentVerified(_documentId, _documentHash, verified);
        
        return verified;
    }
    
    function calculateDocumentId(bytes32 _documentHash, address _owner, uint256 _timestamp) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_documentHash, _owner, _timestamp));
    }
}