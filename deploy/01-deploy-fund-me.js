// const helperConfig = require("../helper-hardhat-config")
// const networkConfig = helperConfig.networkConfig
// [Line1 & Line2 are equal to Line4]
const { networkConfig, devChain } = require("../helper-hardhat-config")
const { network } = require("hardhat")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments

    // Use private key sometimes might confuse people to know which one is for,
    // So we can use getNameAccounts to tell people much understand about current using account
    // Add namedAccounts: {...} to hardhat.config.js file
    const { deployer } = await getNamedAccounts()

    const chainId = network.config.chainId

    // if chainId is X use address Y..etc
    // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    let ethUsdPriceFeedAddress
    if (devChain.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    // if the contract doesn't exist, we deploy a minimal version of that for our local testing

    // when going for localhost or hardhat network we want to use a mock !!
    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, // put price feed address
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    if (!devChain.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(fundMe.address, args)
    }
    log("----------------------------------------------------------------")
}

module.exports.tags = ["all", "fundme"]
