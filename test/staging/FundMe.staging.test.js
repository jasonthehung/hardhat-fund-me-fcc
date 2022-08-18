const { getNamedAccounts, ethers, network } = require("hardhat")
const { devChain } = require("../../helper-hardhat-config")
const { assert } = require("chai")

devChain.includes(network.name)
    ? describe.skip
    : describe("FundMe", async () => {
          let fundMe
          let deployer
          const sendValue = 100
          beforeEach(async () => {
              // same as => const {deployer} = await getNamedAccounts()
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMe", deployer)
          })

          it("allows people to fund and withdraw", async () => {
              await fundMe.fund({ value: sendValue, gasLimit: 1000000 })
              await fundMe.withdraw({ gasLimit: 1000000 })
              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )
              assert.equal(endingBalance.toString(), "0")
          })
      })
