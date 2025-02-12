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

import {clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey} from "@solana/web3.js";
import { generateSigner, Keypair, keypairIdentity, percentAmount } from "@metaplex-foundation/umi";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const user = await getKeypairFromFile();

await airdropIfRequired(
    connection,
    user.publicKey, 
    1 * LAMPORTS_PER_SOL,
    0.5 * LAMPORTS_PER_SOL,
);

console.log(`Loaded User : ${user.publicKey.toBase58()}`);

const umi = createUmi(connection.rpcEndpoint);
umi.use(mplTokenMetadata());

const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
umi.use(keypairIdentity(umiUser));

console.log(`Loaded UMI User Instance: ${umiUser.publicKey.toString()}`);

const collectionMint = generateSigner(umi);

const transaction = createNft( umi, {
    mint: collectionMint.publicKey,
    name: "The ACJ Collection",
    symbol: "ACJ",
    uri: "https://ivory-late-coyote-159.mypinata.cloud/ipfs/bafkreia2njaok3xx2ca3usgsuic2pamcq6gzt6ytsqhllm3dluxeoxjq64",
    sellerFeeBasisPoints: percentAmount(10), 
    isCollection: true,
});

await transaction.sendAndConfirm(umi);

const createdCollectionNft = await fetchDigitalAsset(
    umi, 
    collectionMint.publicKey
);

console.log(`Created Collection NFT, Adress is ${getExplorerLink(
    "address", 
    createdCollectionNft.mint.publicKey, 
    "devnet",
)}`);