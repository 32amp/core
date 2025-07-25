const { expect } = require('chai');
const { deploy } = require("./lib/deploy");
const { ethers } = require('hardhat');

describe("UserTokens", function() {
    before(async function() {
        const accounts = await ethers.getSigners();
        this.owner = accounts[0];
        this.user1 = accounts[1];
        this.user2 = accounts[2];
        
        this.contracts = await deploy({ User: true, UserAccess: true, UserTokens: true });
        
        // Добавляем тестовых пользователей
        await this.contracts.User.addUser(this.user1.address);
        
        // Даем пользователю доступ к модулю UserTokens
        await this.contracts.UserAccess.setAccessLevelToModule(
            this.user1.address, 
            "UserTokens", 
            4 // FOURTH уровень доступа
        );
    });

    describe("Initialization", function() {
        it("should initialize with correct version", async function() {
            const version = await this.contracts.UserTokens.getVersion();
            expect(version).to.equal("1.0");
        });
    });

    describe("Token Management", function() {
        const testToken = {
            encrypted_token_id: "encrypted123",
            encrypted_token_id_16: "encrypted456",
            hash_token_id: ethers.keccak256(ethers.toUtf8Bytes("token123")),
            hash_token_id_16: ethers.keccak256(ethers.toUtf8Bytes("token456")),
            token_type: 3, // Central
            expire_date: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            account_for: ethers.ZeroAddress // будет заменен на user1.address
        };

        it("should add new token", async function() {
            const tx = await this.contracts.UserTokens.connect(this.user1).add({
                ...testToken,
                account_for: this.user1.address
            });
            await tx.wait();
            
            // Проверяем, что токен добавлен
            const token = await this.contracts.UserTokens.getTokenByTokenId(testToken.hash_token_id);
            expect(token.id).to.equal(1n);
            expect(token.hash_token_id).to.equal(testToken.hash_token_id);
            expect(token.owner).to.equal(this.user1.address);
            expect(token.account_for).to.equal(this.user1.address);
        });

        it("should fail to add duplicate token", async function() {

            await expect(
                 this.contracts.UserTokens.connect(this.user1).add({
                    ...testToken,
                    account_for: this.user1.address
                })
            ).to.be.revertedWithCustomError(this.contracts.UserTokens, "TokenExist()");
        });

        it("should fail to add token with expired date", async function() {
            await expect(
                this.contracts.UserTokens.connect(this.user1).add({
                    ...testToken,
                    hash_token_id: ethers.keccak256(ethers.toUtf8Bytes("newToken123")),
                    hash_token_id_16: ethers.keccak256(ethers.toUtf8Bytes("newToken456")),
                    expire_date: Math.floor(Date.now() / 1000) - 3600 // expired 1 hour ago
                })
            ).to.be.revertedWithCustomError(this.contracts.UserTokens,"TokenExpireDate()");
        });

        it("should get tokens by account and type", async function() {
            const tokens = await this.contracts.UserTokens.getTokens(
                this.user1.address,
                3 // Central
            );
            expect(tokens.length).to.equal(1);
            expect(tokens[0].hash_token_id).to.equal(testToken.hash_token_id);
        });

        it("should set primary token", async function() {

            const tx = await this.contracts.UserTokens.connect(this.user1).add({
                ...testToken,
                hash_token_id: ethers.keccak256(ethers.toUtf8Bytes("newToken123")),
                hash_token_id_16: ethers.keccak256(ethers.toUtf8Bytes("newToken456")),
                account_for: this.user1.address
            });
            await tx.wait();            
            
            let tx_2 = await this.contracts.UserTokens.connect(this.user1).setPrimaryToken(
                1,
                this.user1.address
            );

            await tx_2.wait()
            
            const [primaryToken] = await this.contracts.UserTokens.getPrimaryToken(this.user1.address);
            expect(primaryToken.id).to.equal(1);
        });

        it("should block and unblock token", async function() {
            
            // Блокируем токен
            let tx_1 = await this.contracts.UserTokens.connect(this.user1).blockToken(1);
            await tx_1.wait()

            let token = await this.contracts.UserTokens.getTokenByTokenId(testToken.hash_token_id);
            expect(token.is_blocked).to.be.true;
            
            // Разблокируем токен
            let tx_2 = await this.contracts.UserTokens.connect(this.user1).unblockToken(1);
            await tx_2.wait()

            token = await this.contracts.UserTokens.getTokenByTokenId(testToken.hash_token_id);
            expect(token.is_blocked).to.be.false;
        });

        it("should update token expire date", async function() {

            const newExpireDate = Math.floor(Date.now() / 1000) + 7200; // 2 hours from now
            
            let tx = await this.contracts.UserTokens.connect(this.user1).changeExpireDate(
                1,
                newExpireDate
            );

            await tx.wait()
            
            const token = await this.contracts.UserTokens.getTokenByTokenId(testToken.hash_token_id);
            expect(token.expire_date).to.equal(newExpireDate);
        });

        it("should fail to update token with expired date", async function() {
            await expect(
                this.contracts.UserTokens.connect(this.user1).changeExpireDate(
                    1,
                    Math.floor(Date.now() / 1000) - 3600 // expired 1 hour ago
                )
            ).to.be.revertedWithCustomError(this.contracts.UserTokens, "TokenExpireDate()");
        });
    });

    describe("Policy Management", function() {
        const testPolicy = {
            allowed_evse_ids: [1, 2, 3],
            allowed_location_ids: [10, 20],
            max_energy_kwh: 100,
            tariff: 50,
            daily_limit: {
                energy: 10,
                cost: 500
            }
        };

        it("should update token policy", async function() {

            
            let tx = await this.contracts.UserTokens.connect(this.user1).updatePolicy(
                1,
                testPolicy
            );

            await tx.wait()
            
            const [, policy] = await this.contracts.UserTokens.getPrimaryToken(this.user1.address);
            expect(policy.tariff).to.equal(testPolicy.tariff);
            expect(policy.allowed_evse_ids.length).to.equal(3);
        });

        it("should get tariff from primary token with context", async function() {
            const ctx = {
                evse_id: 2, // Разрешенный EVSE
                location_id: 0,
                connector_id: 0,
                session_id: 0,
                timestamp: 0,
                caller: this.user1.address,
            };
            
            const tariff = await this.contracts.UserTokens.getTariffFromPrimaryToken(
                this.user1.address,
                ctx
            );
            expect(tariff).to.equal(testPolicy.tariff);
        });

        it("should return 0 tariff for not allowed EVSE", async function() {
            const ctx = {
                evse_id: 99, // Неразрешенный EVSE
                location_id: 0,
                connector_id: 0,
                session_id: 0,
                timestamp: 0,
                caller: this.user1.address,
            };
            
            const tariff = await this.contracts.UserTokens.getTariffFromPrimaryToken(
                this.user1.address,
                ctx
            );
            expect(tariff).to.equal(0);
        });
    });

    describe("Access Control", function() {
        it("should fail when non-user tries to add token", async function() {
            await expect(
                this.contracts.UserTokens.connect(this.user2).add({
                    encrypted_token_id: "encrypted789",
                    encrypted_token_id_16: "encrypted012",
                    hash_token_id: ethers.keccak256(ethers.toUtf8Bytes("token789")),
                    hash_token_id_16: ethers.keccak256(ethers.toUtf8Bytes("token012")),
                    token_type: 3, // Central
                    expire_date: Math.floor(Date.now() / 1000) + 3600,
                    account_for: this.user2.address
                })
            ).to.be.revertedWithCustomError(this.contracts.UserTokens, "ObjectNotFound(string object, uint object_id)").withArgs("User", 0); // User does not exist
        });
    });
});