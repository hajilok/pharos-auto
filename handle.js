import Web3 from "web3";
import { config } from "./config.js";

const handle = async (privatekey) => {
  const web3 = new Web3(config.urlRPC); // Use the RPC URL from config
  const account = web3.eth.accounts.privateKeyToAccount(
    privatekey.startsWith("0x") ? privatekey : "0x" + privatekey
  );
  web3.eth.accounts.wallet.add(account);
  return {
    wallet: web3,
    address: account.address,
    account,
    balance: {
      pharos: async () => {
        const balance = await web3.eth.getBalance(account.address);
        return web3.utils.fromWei(balance, "ether");
      },
      usdc: async () => {
        const contract = new web3.eth.Contract(
          [
            {
              constant: true,
              inputs: [{ name: "_owner", type: "address" }],
              name: "balanceOf",
              outputs: [{ name: "", type: "uint256" }],
              payable: false,
              stateMutability: "view",
              type: "function",
            },
            {
              constant: true,
              name: "decimals",
              type: "function",
              inputs: [],
              outputs: [{ name: "", type: "uint8" }],
            },
          ],
          "0xad902cf99c2de2f1ba5ec4d642fd7e49cae9ee37"
        );
        const rawBalance = BigInt(
          await contract.methods.balanceOf(account.address).call()
        );
        const decimals = parseInt(await contract.methods.decimals().call());

        // Hitung divisor dalam BigInt
        const divisor = BigInt(10) ** BigInt(decimals);

        // Ubah ke string dengan desimal
        const wholePart = rawBalance / divisor;
        const fractionalPart = rawBalance % divisor;

        const fractionalStr = fractionalPart
          .toString()
          .padStart(decimals, "0")
          .replace(/0+$/, "");
        const displayBalance = fractionalStr
          ? `${wholePart}.${fractionalStr}`
          : `${wholePart}`;

        return displayBalance;
      },
    },
  };
};
export default handle;
