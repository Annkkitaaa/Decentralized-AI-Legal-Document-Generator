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
    await documentRegistry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await documentRegistry.getAddress()).to.be.properAddress;
    });
  });

  describe("Document Registration", function () {
    const documentContent = "Test Document Content";
    const documentType = "Test Document";
    const metadata = "Test Metadata";
    let documentHash;

    beforeEach(function () {
      documentHash = ethers.keccak256(ethers.toUtf8Bytes(documentContent));
    });

    it("Should register a document and emit an event", async function () {
      const tx = await documentRegistry.registerDocument(documentHash, documentType, metadata);
      const receipt = await tx.wait();

      // Find the DocumentRegistered event
      const event = receipt.logs.find(log => {
        try {
          const parsed = documentRegistry.interface.parseLog(log);
          return parsed && parsed.name === "DocumentRegistered";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;

      const userDocs = await documentRegistry.getUserDocuments();
      expect(userDocs.length).to.equal(1);
    });

    it("Should track document hash registration", async function () {
      await documentRegistry.registerDocument(documentHash, documentType, metadata);

      const isRegistered = await documentRegistry.isDocumentHashRegistered(documentHash);
      expect(isRegistered).to.be.true;
    });

    it("Should add document to user's document list", async function () {
      await documentRegistry.registerDocument(documentHash, documentType, metadata);

      const userDocs = await documentRegistry.getUserDocuments();
      expect(userDocs.length).to.equal(1);
    });

    it("Should allow multiple documents per user", async function () {
      const hash1 = ethers.keccak256(ethers.toUtf8Bytes("Document 1"));
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("Document 2"));

      await documentRegistry.registerDocument(hash1, "Type1", "Meta1");
      await documentRegistry.registerDocument(hash2, "Type2", "Meta2");

      const userDocs = await documentRegistry.getUserDocuments();
      expect(userDocs.length).to.equal(2);
    });

    describe("Input Validation", function () {
      it("Should revert when document hash is zero", async function () {
        await expect(
          documentRegistry.registerDocument(ethers.ZeroHash, documentType, metadata)
        ).to.be.revertedWithCustomError(documentRegistry, "InvalidDocumentHash");
      });

      it("Should revert when document type is empty", async function () {
        await expect(
          documentRegistry.registerDocument(documentHash, "", metadata)
        ).to.be.revertedWithCustomError(documentRegistry, "InvalidDocumentType");
      });

      it("Should revert when document type is too long", async function () {
        const longType = "A".repeat(101); // MAX is 100

        await expect(
          documentRegistry.registerDocument(documentHash, longType, metadata)
        ).to.be.revertedWithCustomError(documentRegistry, "DocumentTypeTooLong");
      });

      it("Should accept document type at maximum length", async function () {
        const maxType = "A".repeat(100); // Exactly at MAX

        await expect(
          documentRegistry.registerDocument(documentHash, maxType, metadata)
        ).to.not.be.reverted;
      });

      it("Should revert when metadata is too long", async function () {
        const longMetadata = "A".repeat(1001); // MAX is 1000

        await expect(
          documentRegistry.registerDocument(documentHash, documentType, longMetadata)
        ).to.be.revertedWithCustomError(documentRegistry, "MetadataTooLong");
      });

      it("Should accept metadata at maximum length", async function () {
        const maxMetadata = "A".repeat(1000); // Exactly at MAX

        await expect(
          documentRegistry.registerDocument(documentHash, documentType, maxMetadata)
        ).to.not.be.reverted;
      });

      it("Should accept empty metadata", async function () {
        await expect(
          documentRegistry.registerDocument(documentHash, documentType, "")
        ).to.not.be.reverted;
      });
    });
  });

  describe("Document Retrieval", function () {
    let documentId;
    const documentContent = "Test Document Content";
    const documentType = "Test Document";
    const metadata = "Test Metadata";
    let documentHash;

    beforeEach(async function () {
      documentHash = ethers.keccak256(ethers.toUtf8Bytes(documentContent));

      const tx = await documentRegistry.registerDocument(documentHash, documentType, metadata);
      const receipt = await tx.wait();

      // Parse logs to get document ID
      const event = receipt.logs.find(log => {
        try {
          const parsed = documentRegistry.interface.parseLog(log);
          return parsed && parsed.name === "DocumentRegistered";
        } catch {
          return false;
        }
      });

      const parsedEvent = documentRegistry.interface.parseLog(event);
      documentId = parsedEvent.args.documentId;
    });

    it("Should retrieve document details for the owner", async function () {
      const document = await documentRegistry.getDocument(documentId);

      expect(document.owner).to.equal(owner.address);
      expect(document.documentHash).to.equal(documentHash);
      expect(document.documentType).to.equal(documentType);
      expect(document.metadata).to.equal(metadata);
      expect(document.timestamp).to.be.gt(0);
    });

    it("Should limit document details for non-owners", async function () {
      const document = await documentRegistry.connect(addr1).getDocument(documentId);

      expect(document.owner).to.equal(owner.address);
      expect(document.documentHash).to.equal(ethers.ZeroHash);
      expect(document.documentType).to.equal(documentType);
      expect(document.metadata).to.equal("");
    });

    it("Should revert when retrieving non-existent document", async function () {
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("fake"));

      await expect(
        documentRegistry.getDocument(fakeId)
      ).to.be.revertedWithCustomError(documentRegistry, "DocumentNotFound");
    });

    it("Should return correct user documents", async function () {
      // Register another document
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("Document 2"));
      await documentRegistry.registerDocument(hash2, "Type2", "Meta2");

      const userDocs = await documentRegistry.getUserDocuments();
      expect(userDocs.length).to.equal(2);
      expect(userDocs[0]).to.equal(documentId);
    });

    it("Should return empty array for user with no documents", async function () {
      const userDocs = await documentRegistry.connect(addr1).getUserDocuments();
      expect(userDocs.length).to.equal(0);
    });
  });

  describe("Document Verification", function () {
    let documentId;
    const documentContent = "Test Document Content";
    const documentType = "Test Document";
    const metadata = "Test Metadata";
    let documentHash;

    beforeEach(async function () {
      documentHash = ethers.keccak256(ethers.toUtf8Bytes(documentContent));

      const tx = await documentRegistry.registerDocument(documentHash, documentType, metadata);
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          const parsed = documentRegistry.interface.parseLog(log);
          return parsed && parsed.name === "DocumentRegistered";
        } catch {
          return false;
        }
      });

      const parsedEvent = documentRegistry.interface.parseLog(event);
      documentId = parsedEvent.args.documentId;
    });

    it("Should verify a document with correct hash", async function () {
      const tx = await documentRegistry.verifyDocument(documentId, documentHash);
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          const parsed = documentRegistry.interface.parseLog(log);
          return parsed && parsed.name === "DocumentVerified";
        } catch {
          return false;
        }
      });

      const parsedEvent = documentRegistry.interface.parseLog(event);
      expect(parsedEvent.args.verified).to.be.true;
      expect(parsedEvent.args.documentId).to.equal(documentId);
      expect(parsedEvent.args.documentHash).to.equal(documentHash);
    });

    it("Should fail verification with incorrect hash", async function () {
      const wrongHash = ethers.keccak256(ethers.toUtf8Bytes("Wrong Content"));

      const tx = await documentRegistry.verifyDocument(documentId, wrongHash);
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          const parsed = documentRegistry.interface.parseLog(log);
          return parsed && parsed.name === "DocumentVerified";
        } catch {
          return false;
        }
      });

      const parsedEvent = documentRegistry.interface.parseLog(event);
      expect(parsedEvent.args.verified).to.be.false;
    });

    it("Should allow anyone to verify a document", async function () {
      const tx = await documentRegistry.connect(addr1).verifyDocument(documentId, documentHash);
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          const parsed = documentRegistry.interface.parseLog(log);
          return parsed && parsed.name === "DocumentVerified";
        } catch {
          return false;
        }
      });

      const parsedEvent = documentRegistry.interface.parseLog(event);
      expect(parsedEvent.args.verified).to.be.true;
    });

    it("Should revert when verifying non-existent document", async function () {
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("fake"));

      await expect(
        documentRegistry.verifyDocument(fakeId, documentHash)
      ).to.be.revertedWithCustomError(documentRegistry, "DocumentNotFound");
    });

    it("Should revert when verifying with zero hash", async function () {
      await expect(
        documentRegistry.verifyDocument(documentId, ethers.ZeroHash)
      ).to.be.revertedWithCustomError(documentRegistry, "InvalidDocumentHash");
    });
  });

  describe("Document ID Calculation", function () {
    it("Should calculate document ID correctly", async function () {
      const documentHash = ethers.keccak256(ethers.toUtf8Bytes("Test Content"));
      const timestamp = Math.floor(Date.now() / 1000);

      const calculatedId = await documentRegistry.calculateDocumentId(
        documentHash,
        owner.address,
        timestamp
      );

      const expectedId = ethers.keccak256(
        ethers.solidityPacked(
          ["bytes32", "address", "uint256"],
          [documentHash, owner.address, timestamp]
        )
      );

      expect(calculatedId).to.equal(expectedId);
    });

    it("Should produce different IDs for different inputs", async function () {
      const hash1 = ethers.keccak256(ethers.toUtf8Bytes("Content 1"));
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("Content 2"));
      const timestamp = Math.floor(Date.now() / 1000);

      const id1 = await documentRegistry.calculateDocumentId(hash1, owner.address, timestamp);
      const id2 = await documentRegistry.calculateDocumentId(hash2, owner.address, timestamp);

      expect(id1).to.not.equal(id2);
    });

    it("Should produce different IDs for same hash at different timestamps", async function () {
      const documentHash = ethers.keccak256(ethers.toUtf8Bytes("Test Content"));
      const timestamp1 = Math.floor(Date.now() / 1000);
      const timestamp2 = timestamp1 + 1;

      const id1 = await documentRegistry.calculateDocumentId(documentHash, owner.address, timestamp1);
      const id2 = await documentRegistry.calculateDocumentId(documentHash, owner.address, timestamp2);

      expect(id1).to.not.equal(id2);
    });
  });

  describe("Hash Registration Tracking", function () {
    it("Should return false for unregistered hash", async function () {
      const unregisteredHash = ethers.keccak256(ethers.toUtf8Bytes("Unregistered"));

      const isRegistered = await documentRegistry.isDocumentHashRegistered(unregisteredHash);
      expect(isRegistered).to.be.false;
    });

    it("Should return true for registered hash", async function () {
      const documentHash = ethers.keccak256(ethers.toUtf8Bytes("Test Content"));

      await documentRegistry.registerDocument(documentHash, "Type", "Meta");

      const isRegistered = await documentRegistry.isDocumentHashRegistered(documentHash);
      expect(isRegistered).to.be.true;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle registration of very short document type", async function () {
      const documentHash = ethers.keccak256(ethers.toUtf8Bytes("Content"));

      await expect(
        documentRegistry.registerDocument(documentHash, "A", "")
      ).to.not.be.reverted;
    });

    it("Should handle multiple users registering documents", async function () {
      const hash1 = ethers.keccak256(ethers.toUtf8Bytes("User1 Doc"));
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("User2 Doc"));

      await documentRegistry.connect(owner).registerDocument(hash1, "Type", "Meta");
      await documentRegistry.connect(addr1).registerDocument(hash2, "Type", "Meta");

      const ownerDocs = await documentRegistry.connect(owner).getUserDocuments();
      const addr1Docs = await documentRegistry.connect(addr1).getUserDocuments();

      expect(ownerDocs.length).to.equal(1);
      expect(addr1Docs.length).to.equal(1);
      expect(ownerDocs[0]).to.not.equal(addr1Docs[0]);
    });

    it("Should handle special characters in metadata", async function () {
      const documentHash = ethers.keccak256(ethers.toUtf8Bytes("Content"));
      const specialMetadata = "Test\nWith\tSpecial\rCharacters!@#$%^&*()";

      await expect(
        documentRegistry.registerDocument(documentHash, "Type", specialMetadata)
      ).to.not.be.reverted;
    });

    it("Should handle unicode in document type", async function () {
      const documentHash = ethers.keccak256(ethers.toUtf8Bytes("Content"));
      const unicodeType = "合同文档";

      await expect(
        documentRegistry.registerDocument(documentHash, unicodeType, "")
      ).to.not.be.reverted;
    });
  });

  describe("Gas Optimization", function () {
    it("Should use custom errors instead of require strings", async function () {
      // Custom errors use less gas than require with error messages
      const documentHash = ethers.ZeroHash;

      await expect(
        documentRegistry.registerDocument(documentHash, "Type", "Meta")
      ).to.be.revertedWithCustomError(documentRegistry, "InvalidDocumentHash");
    });
  });
});
