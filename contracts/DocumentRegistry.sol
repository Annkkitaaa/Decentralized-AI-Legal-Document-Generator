// contracts/DocumentRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract DocumentRegistry {
    // Custom errors for gas efficiency
    error InvalidDocumentHash();
    error InvalidDocumentType();
    error DocumentAlreadyExists();
    error DocumentNotFound();
    error MetadataTooLong();
    error DocumentTypeTooLong();

    // Constants for validation
    uint256 private constant MAX_METADATA_LENGTH = 1000;
    uint256 private constant MAX_DOCUMENT_TYPE_LENGTH = 100;

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
    mapping(bytes32 => bool) private documentHashExists;

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
        // Input validation
        if (_documentHash == bytes32(0)) {
            revert InvalidDocumentHash();
        }
        if (bytes(_documentType).length == 0) {
            revert InvalidDocumentType();
        }
        if (bytes(_documentType).length > MAX_DOCUMENT_TYPE_LENGTH) {
            revert DocumentTypeTooLong();
        }
        if (bytes(_metadata).length > MAX_METADATA_LENGTH) {
            revert MetadataTooLong();
        }

        bytes32 documentId = keccak256(abi.encodePacked(_documentHash, msg.sender, block.timestamp));

        // Check if document already exists
        if (documents[documentId].exists) {
            revert DocumentAlreadyExists();
        }

        documents[documentId] = Document({
            owner: msg.sender,
            documentHash: _documentHash,
            timestamp: block.timestamp,
            documentType: _documentType,
            metadata: _metadata,
            exists: true
        });

        documentHashExists[_documentHash] = true;
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
        if (!doc.exists) {
            revert DocumentNotFound();
        }

        // Anyone can view document metadata, but only owner can see full details
        if (doc.owner != msg.sender) {
            return (doc.owner, bytes32(0), doc.timestamp, doc.documentType, "");
        }

        return (doc.owner, doc.documentHash, doc.timestamp, doc.documentType, doc.metadata);
    }
    
    function verifyDocument(bytes32 _documentId, bytes32 _documentHash) public returns (bool) {
        Document memory doc = documents[_documentId];
        if (!doc.exists) {
            revert DocumentNotFound();
        }
        if (_documentHash == bytes32(0)) {
            revert InvalidDocumentHash();
        }

        bool verified = doc.documentHash == _documentHash;

        emit DocumentVerified(_documentId, _documentHash, verified);

        return verified;
    }

    /// @notice Check if a document hash has been registered
    /// @param _documentHash The hash to check
    /// @return bool True if the hash exists
    function isDocumentHashRegistered(bytes32 _documentHash) public view returns (bool) {
        return documentHashExists[_documentHash];
    }
    
    function calculateDocumentId(bytes32 _documentHash, address _owner, uint256 _timestamp) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_documentHash, _owner, _timestamp));
    }
}