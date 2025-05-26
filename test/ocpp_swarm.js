const { expect } = require('chai');
const {deployProxy} = require("../utils/deploy")
const { getEventArguments } = require("../utils/utils");

describe("OCPPSwarm", function() {
    before(async function() {
        const accounts = await ethers.getSigners();
        this.owner = accounts[0];
        this.nodeOwner = accounts[1];
        
        this.contracts = {}
        
        // Set up initial values
        this.initialPSK = ethers.keccak256(ethers.toUtf8Bytes("test_psk"));
        this.initialDeposit = ethers.parseEther("1.0");
        
        // Initialize the contract
        this.contracts.OCPPSwarm = await deployProxy("OCPPSwarm", [this.initialPSK, this.initialDeposit]);
    });

    it("should initialize with correct values", async function() {
        const psk = await this.contracts.OCPPSwarm.getPSK();
        const depositAmount = await this.contracts.OCPPSwarm.getDepositAmount();
        
        expect(psk).to.equal(this.initialPSK);
        expect(depositAmount).to.equal(this.initialDeposit);
    });

    it("should allow owner to change PSK", async function() {
        const newPSK = ethers.keccak256(ethers.toUtf8Bytes("new_psk"));
        await this.contracts.OCPPSwarm.setPSK(newPSK);
        
        const currentPSK = await this.contracts.OCPPSwarm.getPSK();
        expect(currentPSK).to.equal(newPSK);
    });

    it("should allow owner to change deposit amount", async function() {
        const newDeposit = ethers.parseEther("2.0");
        await this.contracts.OCPPSwarm.setDepositAmount(newDeposit);
        
        const currentDeposit = await this.contracts.OCPPSwarm.getDepositAmount();
        expect(currentDeposit).to.equal(newDeposit);
    });

    it("should register a new node with correct deposit", async function() {
        const peerAddress = "/ip4/127.0.0.1/tcp/8080";
        this.peerId = ethers.keccak256(ethers.toUtf8Bytes("test_peer"));
        const currentDeposit = await this.contracts.OCPPSwarm.getDepositAmount();
        
        const tx = await this.contracts.OCPPSwarm.connect(this.nodeOwner).registerNode(
            peerAddress,
            this.peerId,
            { value: currentDeposit }
        );
        
        await tx.wait();
        
        // Get active nodes and verify registration
        const nodes = await this.contracts.OCPPSwarm.getActiveNodes(1);
        expect(nodes.length).to.equal(1);
        expect(nodes[0].owner).to.equal(this.nodeOwner.address);
        expect(nodes[0].peerId).to.equal(this.peerId);
        expect(nodes[0].deposit).to.equal(currentDeposit);
    });

    it("should not allow registering a node with incorrect deposit", async function() {
        const peerAddress = "/ip4/127.0.0.1/tcp/8081";
        const peerId = ethers.keccak256(ethers.toUtf8Bytes("test_peer2"));
        const currentDeposit = await this.contracts.OCPPSwarm.getDepositAmount();
        const halfDeposit = ethers.parseEther("0.5");
        
        await expect(
            this.contracts.OCPPSwarm.connect(this.nodeOwner).registerNode(
                peerAddress,
                peerId,
                { value: halfDeposit }
            )
        ).to.be.revertedWithCustomError(this.contracts.OCPPSwarm, "IncorrectDepositAmount");
    });

    it("should not allow registering a node with duplicate peerId", async function() {
        const peerAddress = "/ip4/127.0.0.1/tcp/8082";
        const currentDeposit = await this.contracts.OCPPSwarm.getDepositAmount();
        
        // Try to register with the same peerId that was used in the first registration
        await expect(
            this.contracts.OCPPSwarm.connect(this.nodeOwner).registerNode(
                peerAddress,
                this.peerId,
                { value: currentDeposit }
            )
        ).to.be.revertedWithCustomError(this.contracts.OCPPSwarm, "NodeAlreadyRegistered");
    });

    it("should get node info correctly", async function() {
        const nodeInfo = await this.contracts.OCPPSwarm.getNodeInfo(this.nodeOwner.address);
        
        expect(nodeInfo.owner).to.equal(this.nodeOwner.address);
        expect(nodeInfo.isActive).to.be.true;
        expect(nodeInfo.peerId).to.equal(this.peerId);
    });

    it("should register 40 nodes successfully", async function() {
        const currentDeposit = await this.contracts.OCPPSwarm.getDepositAmount();
        const accounts = await ethers.getSigners();
        
        // Register 40 nodes with different owners and peerIds
        for (let i = 0; i < 40; i++) {
            const peerAddress = `/ip4/127.0.0.1/tcp/${8083 + i}`;
            const peerId = ethers.keccak256(ethers.toUtf8Bytes(`test_peer_${i}`));
            const owner = accounts[i % accounts.length];
            
            await this.contracts.OCPPSwarm.connect(owner).registerNode(
                peerAddress,
                peerId,
                { value: currentDeposit }
            );
        }
        
        // Verify total number of nodes
        const nodes = await this.contracts.OCPPSwarm.getActiveNodes(1);
        expect(nodes.length).to.equal(10); // First page should have 10 nodes
    });

    it("should get active nodes by page", async function() {
        // Check first page
        const page1 = await this.contracts.OCPPSwarm.getActiveNodes(1);
        expect(page1.length).to.equal(10);
        
        // Check second page
        const page2 = await this.contracts.OCPPSwarm.getActiveNodes(2);
        expect(page2.length).to.equal(10);
        
        // Check third page
        const page3 = await this.contracts.OCPPSwarm.getActiveNodes(3);
        expect(page3.length).to.equal(10);
        
        // Check fourth page
        const page4 = await this.contracts.OCPPSwarm.getActiveNodes(4);
        expect(page4.length).to.equal(10);
        
        // Check fifth page (should be empty)
        const page5 = await this.contracts.OCPPSwarm.getActiveNodes(5);
        expect(page5.length).to.equal(1);
        
        // Verify some node properties
        expect(page1[0].isActive).to.be.true;
        expect(page2[0].isActive).to.be.true;
        expect(page3[0].isActive).to.be.true;
        expect(page4[0].isActive).to.be.true;
    });
}); 