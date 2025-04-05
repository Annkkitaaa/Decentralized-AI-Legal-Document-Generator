// test/DocumentRegistry.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DocumentRegistry", function () {
  let DocumentRegistry;
  let documentRegistry;
  let owner;
  let addr1;
  let addr2;
  
  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    DocumentRegistry = await ethers.getContractFactory("DocumentRegistry");
    documentRegistry = await DocumentRegistry.deploy();
    await documentRegistry.deployed();
  });
  
  describe("Document Registration", function () {
    it("Should register a document and emit an event", async function () {
      const documentHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Test Document Content"));
      const documentType = "Test Document";
      const metadata = "Test Metadata";
      
      await expect(documentRegistry.registerDocument(documentHash, documentType, metadata))
        .to.emit(documentRegistry, "DocumentRegistered")
        .withArgs(owner.address, expect.any(String), documentHash, documentType);
        
      const userDocs = await documentRegistry.getUserDocuments();
      expect(userDocs.length).to.equal(1);
    });
  });
  
  describe("Document Retrieval", function () {
    it("Should retrieve document details for the owner", async function () {
      const documentHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Test Document Content"));
      const documentType = "Test Document";
      const metadata = "Test Metadata";
      
      const tx = await documentRegistry.registerDocument(documentHash, documentType, metadata);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "DocumentRegistered");
      const documentId = event.args.documentId;
      
      const document = await documentRegistry.getDocument(documentId);
      
      expect(document.owner).to.equal(owner.address);
      expect(document.documentHash).to.equal(documentHash);
      expect(document.documentType).to.equal(documentType);
      expect(document.metadata).to.equal(metadata);
    });
    
    it("Should limit document details for non-owners", async function () {
      const documentHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Test Document Content"));
      const documentType = "Test Document";
      const metadata = "Test Metadata";
      
      const tx = await documentRegistry.registerDocument(documentHash, documentType, metadata);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "DocumentRegistered");
      const documentId = event.args.documentId;
      
      const document = await documentRegistry.connect(addr1).getDocument(documentId);
      
      expect(document.owner).to.equal(owner.address);
      expect(document.documentHash).to.equal(ethers.constants.HashZero); // Should be zero for non-owner
      expect(document.documentType).to.equal(documentType);
      expect(document.metadata).to.equal(""); // Should be empty for non-owner
    });
  });
  
  describe("Document Verification", function () {
    it("Should verify a document correctly", async function () {
      const documentContent = "Test Document Content";
      const documentHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(documentContent));
      const documentType = "Test Document";
      const metadata = "Test Metadata";
      
      const tx = await documentRegistry.registerDocument(documentHash, documentType, metadata);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "DocumentRegistered");
      const documentId = event.args.documentId;
      
      // Verify with correct hash
      await expect(documentRegistry.verifyDocument(documentId, documentHash))
        .to.emit(documentRegistry, "DocumentVerified")
        .withArgs(documentId, documentHash, true);
        
      // Verify with incorrect hash
      const wrongHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Wrong Content"));
      await expect(documentRegistry.verifyDocument(documentId, wrongHash))
        .to.emit(documentRegistry, "DocumentVerified")
        .withArgs(documentId, wrongHash, false);
    });
  });
});