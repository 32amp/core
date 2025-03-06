const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MessageProvider", function () {
    let owner;
    let provider;
    let user;
    let service;
    let serviceSettings;
    const providerDeposit = ethers.parseEther("1.0");

    beforeEach(async function () {
        [owner, provider, user] = await ethers.getSigners();

        serviceSettings = {
            min_provider_deposit: providerDeposit,
            processing_time: 300, // 5 minutes
            service_fee: ethers.parseEther("0.01"),
            min_cost_per_message: ethers.parseEther("0.05"),
            punishment_coast: ethers.parseEther("0.1"),
            service_wallet: await owner.getAddress(),
        };

        this.validProviderConfig = {
            country_code: "US",
            public_key: "0x123",
            terms: "",
            sms_getway: {
                enable: true,
                sender_name: "SMSGate",
                cost_per_message: ethers.parseEther("0.05"),
                time_between_retry: 3600,
            },
            email_getway: {
                enable: false,
                sender_name: "",
                cost_per_message: 0,
                time_between_retry: 0,
            },
        };

        const MessageProvider = await ethers.getContractFactory("MessageProvider");
        service = await MessageProvider.deploy();
        await service.initialize(serviceSettings);
    });

    describe("Initialization", function () {
        it("Should initialize with correct settings", async function () {
            const settings = await service.getServiceInfo();
            expect(settings.service_fee).to.equal(serviceSettings.service_fee);
        });

        it("Should revert if service_fee > min_cost_per_message", async function () {
            const invalidSettings = {
                ...serviceSettings,
                service_fee: ethers.parseEther("0.1"),
                min_cost_per_message: ethers.parseEther("0.05"),
            };

            const MessageProvider = await ethers.getContractFactory("MessageProvider");
            const invalidService = await MessageProvider.deploy();
            await expect(invalidService.initialize(invalidSettings))
                .to.be.revertedWith("service_fee more than min_cost_per_message");
        });
    });

    describe("Service Settings Management", function () {
        it("Should allow owner to change processing time", async function () {
            await service.connect(owner).changeProcessingTime(600);
            const settings = await service.getServiceInfo();
            expect(settings.processing_time).to.equal(600);
        });

        it("Should prevent non-owners from changing settings", async function () {
            await expect(service.connect(user).changeProcessingTime(600))
                .to.be.revertedWithCustomError(service, "OwnableUnauthorizedAccount");
        });
    });

    describe("Provider Registration", function () {


        it("Should register provider with valid config", async function () {
            await expect(
                service.connect(provider).registerProvider(this.validProviderConfig, { value: providerDeposit })
            ).to.emit(service, "AddProvider");
        });

        it("Should revert with insufficient deposit", async function () {
            await expect(
                service.connect(provider).registerProvider(this.validProviderConfig, { value: ethers.parseEther("0.5") })
            ).to.be.revertedWithCustomError(service, "MinimumProviderDeposit");
        });
    });

    describe("Handshake Management", function () {
        let handshakeHash;
        const aesKey = "test-aes-key";

        beforeEach(async function () {
            // Register provider
            const providerConfig = { ...this.validProviderConfig };
            await service.connect(provider).registerProvider(providerConfig, { value: providerDeposit });

            // Create handshake
            const tx = await service.connect(user).requestUserHandshakeWithProvider(
                aesKey,
                await provider.getAddress()
            );
            const receipt = await tx.wait();
            handshakeHash = receipt.logs[0].args.handshake;

        });

        it("Should create valid handshake", async function () {

            const handshake = await service.connect(user).getHandshake(handshakeHash);

            expect(handshake.provider).to.equal(await provider.getAddress());
        });

        it("Check access to handshake for provider", async function () {

            const handshake = await service.connect(provider).getHandshake(handshakeHash);

            expect(handshake.provider).to.equal(await provider.getAddress());
        });


        it("Should allow provider to approve handshake", async function () {
            await service.connect(provider).responseUserHandshakeWithProvider(handshakeHash, true);
            const handshake = await service.connect(provider).getHandshake(handshakeHash);
            expect(handshake.provider_approved).to.be.true;
        });
    });

    describe("SMS Message Flow", function () {
        let handshakeHash;
        const recipient = "+1234567890";
        const messageText = "Test message";

        beforeEach(async function () {
            // Setup provider and approved handshake
            const providerConfig = {
                country_code: "US",
                public_key: "0x123",
                terms: "",
                sms_getway: {
                    enable: true,
                    sender_name: "SMSGate",
                    cost_per_message: ethers.parseEther("0.05"),
                    time_between_retry: 3600,
                },
                email_getway: {
                    enable: false,
                    sender_name: "",
                    cost_per_message: 0,
                    time_between_retry: 0,
                },
            };

            await service.connect(provider).registerProvider(providerConfig, { value: providerDeposit });

            // Create and approve handshake
            const tx = await service.connect(user).requestUserHandshakeWithProvider(
                "aes-key",
                await provider.getAddress()
            );
            const receipt = await tx.wait();
            handshakeHash = receipt.logs[0].args.handshake;
            await service.connect(provider).responseUserHandshakeWithProvider(handshakeHash, true);
        });

        it("Should process successful SMS delivery", async function () {
            const messageCost = ethers.parseEther("0.05");
            const tx = await service.connect(user).requestSendSMS(
                handshakeHash,
                recipient,
                messageText,
                { value: messageCost }
            );

            const receipt = await tx.wait();
            const messageHash = receipt.logs[0].args.message_hash;

            await service.connect(provider).responseSendSMS(messageHash, true, 0);

            const sms = await service.connect(user).getSms(messageHash);
            expect(sms.delivered).to.be.true;
        });
    });

    describe("Email Message Flow", function () {
        let handshakeHash;
        const recipient = "test@test.com";
        const subject = "Test message";
        const body = "body message";

        beforeEach(async function () {
            // Setup provider and approved handshake
            const providerConfig = {
                country_code: "US",
                public_key: "0x123",
                terms: "",
                sms_getway: {
                    enable: false,
                    sender_name: "",
                    cost_per_message: 0,
                    time_between_retry: 0,
                },
                email_getway: {
                    enable: true,
                    sender_name: "provider@emailprovider.com",
                    cost_per_message: ethers.parseEther("0.05"),
                    time_between_retry: 3600,
                },
            };

            await service.connect(provider).registerProvider(providerConfig, { value: providerDeposit });

            // Create and approve handshake
            const tx = await service.connect(user).requestUserHandshakeWithProvider(
                "aes-key",
                await provider.getAddress()
            );
            const receipt = await tx.wait();
            handshakeHash = receipt.logs[0].args.handshake;
            await service.connect(provider).responseUserHandshakeWithProvider(handshakeHash, true);
        });

        it("Should process successful Email delivery", async function () {
            const messageCost = ethers.parseEther("0.05");
            const tx = await service.connect(user).requestSendEmail(
                handshakeHash,
                recipient,
                subject,
                body,
                { value: messageCost }
            );

            const receipt = await tx.wait();
            const messageHash = receipt.logs[0].args.message_hash;

            await service.connect(provider).responseSendEmail(messageHash, true, 0);

            const sms = await service.connect(user).getEmail(messageHash);
            expect(sms.delivered).to.be.true;
        });
    });

    describe("Withdrawals", function () {
        it("Should allow owner to withdraw fees", async function () {
            // Accumulate some fees
            const providerConfig = {
                sms_getway: {
                    enable: true,
                    cost_per_message: ethers.parseEther("0.05"),
                    time_between_retry: 0,
                    sender_name: "Test"
                },
                email_getway: {
                    enable: false,
                    cost_per_message: 0,
                    time_between_retry: 0,
                    sender_name: ""
                },
                country_code: "US",
                public_key: "0x123",
                terms: ""
            };

            await service.connect(provider).registerProvider(providerConfig, { value: providerDeposit });

            // Create and approve handshake
            const txx = await service.connect(user).requestUserHandshakeWithProvider(
                "aes-key",
                await provider.getAddress()
            );

            const receipt = await txx.wait();
            handshakeHash = receipt.logs[0].args.handshake;
            await service.connect(provider).responseUserHandshakeWithProvider(handshakeHash, true);

            // Send message
            const tx = await service.connect(user).requestSendSMS(
                handshakeHash,
                "+1234567890",
                "Test",
                { value: ethers.parseEther("0.05") }
            );

            const beforeBalance = await ethers.provider.getBalance(serviceSettings.service_wallet);
            await service.connect(owner).withdraw();
            const afterBalance = await ethers.provider.getBalance(serviceSettings.service_wallet);

            expect(afterBalance).to.be.gt(beforeBalance);
        });
    });
});