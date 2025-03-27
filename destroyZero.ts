import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";

const mnemonics: string = process.env.MNEMONICS!;

const client = new SuiClient({
    url: getFullnodeUrl("mainnet"),
});

const keypair = Ed25519Keypair.deriveKeypair(mnemonics);
const wallet = keypair.toSuiAddress();

const res = await client.getAllCoins({ owner: wallet });

const tx = new Transaction();
for (const coinInfo of res.data) {
    if (coinInfo.balance === "0") {
        tx.moveCall({
            package: "0x2",
            module: "coin",
            function: "destroy_zero",
            arguments: [
                tx.object(coinInfo.coinObjectId),
            ],
            typeArguments: [
                coinInfo.coinType,
            ],
        });
    }
}
tx.setSender(wallet);
const dataSentToFullnode = await tx.build({ client: client });
const dryrunResult = await client.dryRunTransactionBlock({
    transactionBlock: dataSentToFullnode,
});
console.log(dryrunResult.balanceChanges);
const result = await client.signAndExecuteTransaction({ transaction: tx, signer: keypair});
console.log("result", result);