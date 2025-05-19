import axios from "axios";
import handle from "../../handle.js";
import swapABI from "./Abi.js";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const swapPharostousdc = async (privatekey, jwt) => {
  const { wallet, address, balance } = await handle(privatekey);
  console.log(`Wallet: ${address}`);
  if ((await balance.pharos()) < 0.1) {
    try {
      const getFaucet = await axios.post(
        `https://api.pharosnetwork.xyz/faucet/daily?address=${address}`,
        null,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
            Referer: "https://testnet.pharosnetwork.xyz/",
          },
        }
      );
      if (getFaucet.data.msg !== "ok") {
        console.log(`faucet error: ${getFaucet.data.msg}`);
      } else {
        console.log(`Pharos Faucet Success: ${getFaucet.data.msg}`);
      }
    } catch (error) {
      console.error("Error fetching faucet:", error);
    }
  } else {
    console.log(`Pharos balance: ${await balance.pharos()}`);
  }

  if ((await balance.usdc()) < 10) {
    try {
      const getFaucet = await axios.post(
        "https://testnet-router.zenithswap.xyz/api/v1/faucet",
        {
          tokenAddress: `0xAD902CF99C2dE2f1Ba5ec4D642Fd7E49cae9EE37`,
          userAddress: address,
        }
      );
      if (getFaucet.data.status !== 400) {
        console.log(`USDC Faucet Success: ${getFaucet.data.message}`);
      }
    } catch (error) {
      console.error("Error fetching faucet:", error.message);
    }
  } else {
    console.log(`USDC balance: ${await balance.usdc()}`);
  }

  try {
    await delay(10000);
    const contract = new wallet.eth.Contract(
      swapABI,
      "0x1a4de519154ae51200b0ad7c90f7fac75547888a"
    );

    const amountIn = wallet.utils.toWei("0.001", "ether");

    // Estimate amountOutMinimum (placeholder: 0.01 ETH to USDC)
    const amountOutMinimum = "100000"; // set to 0.1 USDC (adjust as needed)

    const exactInputSingleData = wallet.eth.abi.encodeFunctionCall(
      {
        name: "exactInputSingle",
        type: "function",
        inputs: [
          {
            type: "tuple",
            name: "params",
            components: [
              { name: "tokenIn", type: "address" },
              { name: "tokenOut", type: "address" },
              { name: "fee", type: "uint24" },
              { name: "recipient", type: "address" },
              { name: "amountIn", type: "uint256" },
              { name: "amountOutMinimum", type: "uint256" },
              { name: "sqrtPriceLimitX96", type: "uint160" },
            ],
          },
        ],
      },
      [
        {
          tokenIn: "0x76aaada469d23216be5f7c596fa25f282ff9b364", // WETH (replace with actual WETH on your chain)
          tokenOut: "0xAD902CF99C2dE2f1Ba5ec4D642Fd7E49cae9EE37", // USDC
          fee: 500,
          recipient: address,
          amountIn: amountIn,
          amountOutMinimum: amountOutMinimum,
          sqrtPriceLimitX96: "0",
        },
      ]
    );

    const selfCall = Math.floor(Date.now() / 1000) + 60 * 20;
    const bytes = [exactInputSingleData];
    const data = contract.methods.multicall(selfCall, bytes).encodeABI();

    const gasLimit = await wallet.eth.estimateGas({
      from: address,
      to: "0x1a4de519154ae51200b0ad7c90f7fac75547888a",
      data: data,
      value: amountIn,
    });

    const tx = {
      from: address,
      to: "0x1a4de519154ae51200b0ad7c90f7fac75547888a",
      data: data,
      gas: Math.floor(Number(gasLimit) * 3),
      gasPrice: Number(await wallet.eth.getGasPrice()) * 2,
      nonce: await wallet.eth.getTransactionCount(address, "pending"),
      value: amountIn,
    };

    const signedTx = await wallet.eth.accounts.signTransaction(
      tx,
      privatekey.startsWith("0x") ? privatekey : "0x" + privatekey
    );

    const receipt = await wallet.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );

    return {
      message: `Transaction Multicall PHAROS to USDC successful with hash: https://testnet.pharosscan.xyz/tx/${receipt.transactionHash}`,
      status: true,
      txHash: receipt.transactionHash,
    };
  } catch (error) {
    return `Error: ${error.message}`;
  }
};

export const swapUsdcToPharos = async (privatekey) => {
  await delay(10000);
  const { wallet, address } = await handle(privatekey);

  const tokenIn = "0xAD902CF99C2dE2f1Ba5ec4D642Fd7E49cae9EE37";
  const tokenOut = "0x76aaada469d23216be5f7c596fa25f282ff9b364";
  const amountIn = wallet.utils.toWei("2", "ether");
  const amountOutMinimum = "0"; // 0.001 ETH (adjust as needed)
  const deadline = Math.floor(Date.now() / 1000) + 600;

  const erc20Abi = [
    {
      constant: false,
      name: "approve",
      type: "function",
      inputs: [
        { name: "spender", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      outputs: [{ name: "", type: "bool" }],
    },
  ];

  try {
    await delay(10000);
    const tokenContract = new wallet.eth.Contract(erc20Abi, tokenIn);
    await tokenContract.methods
      .approve("0x1a4de519154ae51200b0ad7c90f7fac75547888a", amountIn)
      .send({ from: address });

    const contract = new wallet.eth.Contract(
      swapABI,
      "0x1a4de519154ae51200b0ad7c90f7fac75547888a"
    );

    const exactInputSingleData = wallet.eth.abi.encodeFunctionCall(
      {
        name: "exactInputSingle",
        type: "function",
        inputs: [
          {
            type: "tuple",
            name: "params",
            components: [
              { name: "tokenIn", type: "address" },
              { name: "tokenOut", type: "address" },
              { name: "fee", type: "uint24" },
              { name: "recipient", type: "address" },
              { name: "amountIn", type: "uint256" },
              { name: "amountOutMinimum", type: "uint256" },
              { name: "sqrtPriceLimitX96", type: "uint160" },
            ],
          },
        ],
      },
      [
        {
          tokenIn,
          tokenOut,
          fee: 500,
          recipient: address,
          amountIn,
          amountOutMinimum,
          sqrtPriceLimitX96: "0",
        },
      ]
    );

    const bytes = [exactInputSingleData];
    const data = contract.methods.multicall(deadline, bytes).encodeABI();

    const gasLimit = await wallet.eth.estimateGas({
      from: address,
      to: "0x1a4de519154ae51200b0ad7c90f7fac75547888a",
      data,
    });

    const tx = {
      from: address,
      to: "0x1a4de519154ae51200b0ad7c90f7fac75547888a",
      data,
      gas: Math.floor(Number(gasLimit) * 2),
      gasPrice: Number(await wallet.eth.getGasPrice()) * 2,
      nonce: await wallet.eth.getTransactionCount(address, "pending"),
    };

    const signedTx = await wallet.eth.accounts.signTransaction(
      tx,
      privatekey.startsWith("0x") ? privatekey : "0x" + privatekey
    );

    const receipt = await wallet.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );

    return {
      message: `Transaction Multicall Usdc to PHAROS successful with hash: https://testnet.pharosscan.xyz/tx/${receipt.transactionHash}`,
      status: true,
      txHash: receipt.transactionHash,
    };
  } catch (error) {
    return `Error: ${error.message}`;
  }
};
