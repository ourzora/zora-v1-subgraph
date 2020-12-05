import {BigNumber, Wallet} from "ethers";
import {BaseErc20Factory} from "@zoralabs/media/dist/typechain";
import {MaxUint256} from "@ethersproject/constants";

export async function deployCurrency(wallet: Wallet): Promise<string> {
    const bidCurrencyDeployTx = await new BaseErc20Factory(wallet).deploy(
        "Breckcoin",
        "BRECK",
        BigNumber.from(18)
    );
    await bidCurrencyDeployTx.deployed();
    return bidCurrencyDeployTx.address;
}

export async function approveCurrency(wallet: Wallet, tokenAddress: string, to: string): Promise<void> {
    const tx = await BaseErc20Factory.connect(tokenAddress, wallet).approve(to, MaxUint256);
}

export async function mintCurrency(wallet: Wallet, tokenAdress: string, to: string, amount: BigNumber): Promise<void> {
    const tx = await BaseErc20Factory.connect(tokenAdress, wallet).mint(to, amount);
}