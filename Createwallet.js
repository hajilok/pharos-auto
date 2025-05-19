import Web3 from "web3";
import fs from "fs/promises";
import { existsSync } from "fs";
import { config } from "./config.js";

const FILENAME = "wallet.txt";
const MAX_WALLETS = config.maxWalletCreate; // Maximum number of wallets to generate

const ensureFileExists = async (filePath) => {
  if (!existsSync(filePath)) {
    await fs.writeFile(filePath, "");
  }
};

const countLines = async (filePath) => {
  await ensureFileExists(filePath);
  const content = await fs.readFile(filePath, "utf8");
  return content.split("\n").filter(Boolean).length;
};

const createWallet = async () => {
  const web3 = new Web3(config.urlRPC);
  const wallet = web3.eth.accounts.create();
  const privateKey = wallet.privateKey.replace("0x", "");
  await fs.appendFile(FILENAME, privateKey + "\n");
  await fs.appendFile("address.txt", wallet.address + "\n");
};

export const generatedWallet = async () => {
  await ensureFileExists(FILENAME);
  await ensureFileExists("address.txt");

  const existing = await countLines(FILENAME);
  const remaining = MAX_WALLETS - existing;

  if (remaining <= 0) {
    return;
  }

  for (let i = 0; i < remaining; i++) {
    await createWallet();
  }

  return `🎉 Done. Total wallets now: ${MAX_WALLETS}`;
};
