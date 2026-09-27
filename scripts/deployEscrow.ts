import hre from "hardhat";

async function main() {
    const { ethers } = await hre.network.connect();

    const [buyer, seller] = await ethers.getSigners();

    console.log("Buyer:", buyer.address);
    console.log("Seller:", seller.address);

    const Escrow = await ethers.getContractFactory("NexoraEscrow");

    const escrow = await Escrow.deploy(
        seller.address,
        {
            value: ethers.parseEther("1"),
        }
    );

    await escrow.waitForDeployment();

    console.log(
        "NexoraEscrow deployed to:",
        await escrow.getAddress()
    );

    console.log(
        "Escrow balance:",
        ethers.formatEther(await escrow.getBalance()),
        "ETH"
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});