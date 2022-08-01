module.exports = async ({ getNameAccounts, deployments }) => {
    const { deploy, log } = deployments

    // Use private key sometimes might confuse people to know which one is for,
    // So we can use getNameAccounts to tell people much understand about current using account
    // Add namedAccounts: {...} to hardhat.config.js file
    const { deployer } = await getNameAccounts()

    const chainId = network.config.chainId

    // when going for localhost or hardhat network we want to use a mock !!
}
