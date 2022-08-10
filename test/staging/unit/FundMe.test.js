const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")

describe("FundMe", async function () {
    let fundMe
    let deployer
    let mockV3Aggregator
    const sendValue = ethers.utils.parseEther("1")

    beforeEach(async function () {
        // deploy our fundMe contract
        // using Hardhat-deploy

        /*
        [Just another approach to deal with accounts]
        According to which network you are, it gives you accounts in config
        // const accounts = await ethers.getSigners()
        // const accountZero = accounts[0]
        */

        // same as => const {deployer} = await getNamedAccounts()
        deployer = (await getNamedAccounts()).deployer

        // run deploy scripts in deploy folder
        await deployments.fixture(["all"])

        // what ever we call a function in fundMe, it will be from "deployer"
        fundMe = await ethers.getContract("FundMe", deployer)

        mockV3Aggregator = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        )
    })

    describe("constructor", async function () {
        it("sets the aggregator addresses correctly", async function () {
            const resposne = await fundMe.priceFeed()
            assert.equal(resposne, mockV3Aggregator.address)
        })
    })

    describe("fund", async function () {
        it("Fails if you don't send enough ETH", async function () {
            await expect(fundMe.fund()).to.be.revertedWith(
                "You need to spend more ETH!!"
            )
        })

        it("updated the amount funded data structure", async function () {
            await fundMe.fund({ value: sendValue })
            const resposne = await fundMe.addressToAmountFunded(deployer)
            assert.equal(resposne.toString(), sendValue.toString())
        })

        it("Adds funder to array of funders", async () => {
            await fundMe.fund({ value: sendValue })
            const funder = await fundMe.funders(0)
            assert.equal(funder, deployer)
        })
    })

    describe("withdraw", async function () {
        beforeEach(async function () {
            await fundMe.fund({ value: sendValue })
        })

        it("Withdraw ETH from a single funder", async function () {
            // Arrange
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            // Act
            const txResponse = await fundMe.withdraw()
            const txReceipt = await txResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = txReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            // Assert
            assert.equal(endingFundMeBalance.toString(), 0)
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(gasCost).toString()
            )
        })

        it("allows us to withdraw multiple funders", async function () {
            const accounts = await ethers.getSigners()
            for (let i = 1; i < 9; i++) {
                const fundMeConnectedContract = await fundMe.connect(
                    accounts[i]
                )
                await fundMeConnectedContract.fund({ value: sendValue })
            }

            // Arrange
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            // Act
            const txResponse = await fundMe.withdraw()
            const txReceipt = await txResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = txReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            // Assert
            assert.equal(endingFundMeBalance.toString(), 0)
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(gasCost).toString()
            )

            // Make sure that the funders are reset properly
            const resposne = await fundMe.funders
            assert.equal(resposne.length, 0)

            for (let i = 0; i < 9; i++) {
                assert.equal(
                    await fundMe.addressToAmountFunded(accounts[i].address),
                    0
                )
            }
        })
    })
})
