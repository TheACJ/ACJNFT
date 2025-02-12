import {
    createNft,
    fetchDigitalAsset,
    mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";

import {
    airdropIfRequired,
    getExplorerLink,
    getKeypairFromFile,
} from "@solana-developers/helpers";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createSignerFromKeypair } from '@metaplex-foundation/umi';

import { clusterApiUrl, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { 
    generateSigner, 
    signerIdentity, 
    percentAmount,
    some 
} from "@metaplex-foundation/umi";

const connection = new Connection(clusterApiUrl("devnet"));

const user = await getKeypairFromFile();

await airdropIfRequired(
    connection,
    user.publicKey,
    2 * LAMPORTS_PER_SOL,
    0.5 * LAMPORTS_PER_SOL,
);

console.log(`Loaded User: ${user.publicKey.toBase58()}`);

const umi = createUmi(connection.rpcEndpoint);
umi.use(mplTokenMetadata());

const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
const userSigner = createSignerFromKeypair(umi, umiUser);
umi.use(signerIdentity(userSigner));

console.log(`Loaded UMI User Instance: ${umiUser.publicKey.toString()}`);

// Generate the collection mint signer
const mint = generateSigner(umi);
console.log(`Collection Mint: ${mint.publicKey.toString()}`);

try {
    // Create the NFT directly - createNft will handle mint creation
    const transaction = createNft(umi, {
        mint,
        name: "The ACJ Collection",
        symbol: "ACJ",
        uri: "https://ivory-late-coyote-159.mypinata.cloud/ipfs/bafkreia2njaok3xx2ca3usgsuic2pamcq6gzt6ytsqhllm3dluxeoxjq64",
        sellerFeeBasisPoints: percentAmount(10),
        isCollection: true,
        creators: some([
            {
                address: userSigner.publicKey,
                verified: true,
                share: 100,
            },
        ]),
    });

    await transaction.sendAndConfirm(umi, {
        send: {
            skipPreflight: true,
        },
    });

    console.log("NFT created successfully");

    const createdCollectionNft = await fetchDigitalAsset(umi, mint.publicKey);

    console.log(
        `Created Collection NFT, Address is ${getExplorerLink(
            "address",
            createdCollectionNft.mint.publicKey,
            "devnet"
        )}`
    );
} catch (error) {
    console.error("Error creating NFT:", error);
    throw error;
}