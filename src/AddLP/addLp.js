import handle from "../../handle.js";
import lpABI from "./LpABI.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const addLp = async (privatekey) => {
  await delay(10000);
  const { wallet, account, address } = await handle(privatekey);
  if (!wallet || !address) {
    return "RPC Error: Unable to connect to the wallet or address.";
  }

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

  const tokenContract = new wallet.eth.Contract(
    erc20Abi,
    `0xAD902CF99C2dE2f1Ba5ec4D642Fd7E49cae9EE37`
  );
  try {
    const approveData = await tokenContract.methods
      .approve(
        "0xF8a1D4FF0f9b9Af7CE58E1fc1833688F3BFd6115",
        `0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff`
      )
      .send({ from: account.address });
    if (!approveData.status) {
      return {
        message: "Error: Approval failed",
        status: false,
      };
    }
  } catch (error) {
    return {
      message: `Error: Approval failed - ${error.message}`,
      status: false,
    };
  }

  await delay(10000);

  const addLiquidityData = wallet.eth.abi.encodeFunctionCall(
    {
      name: "mint",
      type: "function",
      outputs: [],
      stateMutability: "nonpayable",
      inputs: [
        {
          components: [
            { internalType: "address", name: "token0", type: "address" },
            { internalType: "address", name: "token1", type: "address" },
            { internalType: "uint24", name: "fee", type: "uint24" },
            { internalType: "int24", name: "tickLower", type: "int24" },
            { internalType: "int24", name: "tickUpper", type: "int24" },
            {
              internalType: "uint256",
              name: "amount0Desired",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "amount1Desired",
              type: "uint256",
            },
            { internalType: "uint256", name: "amount0Min", type: "uint256" },
            { internalType: "uint256", name: "amount1Min", type: "uint256" },
            { internalType: "address", name: "recipient", type: "address" },
            { internalType: "uint256", name: "deadline", type: "uint256" },
          ],
          internalType: "struct MintParams",
          name: "params",
          type: "tuple",
        },
      ],
    },
    [
      {
        token0: "0x76aaada469d23216be5f7c596fa25f282ff9b364",
        token1: "0xAD902CF99C2dE2f1Ba5ec4D642Fd7E49cae9EE37",
        fee: 3000,
        tickLower: -600,
        tickUpper: 600,
        amount0Desired: wallet.utils.toWei("0.001", "ether"),
        amount1Desired: wallet.utils.toWei("0.001", "ether"),
        amount0Min: "0",
        amount1Min: "0",
        recipient: address,
        deadline: Math.floor(Date.now() / 1000) + 600,
      },
    ]
  );

  try {
    const contract = new wallet.eth.Contract(
      lpABI,
      "0xF8a1D4FF0f9b9Af7CE58E1fc1833688F3BFd6115"
    );
    const datas = [addLiquidityData, `0x12210e8a`];
    const data = contract.methods.multicall(datas).encodeABI();

    const gasLimit = await contract.methods
      .multicall(datas)
      .estimateGas({ from: address });

    const tx = {
      from: address,
      to: "0xF8a1D4FF0f9b9Af7CE58E1fc1833688F3BFd6115",
      data,
      gas: Math.floor(Number(gasLimit) * 3),
      gasPrice: Number(await wallet.eth.getGasPrice()) * 2,
      nonce: await wallet.eth.getTransactionCount(address, "pending"),
    };

    const MAX_WAIT_TIME = 120000; // 2 menit
    const interval = 5000;
    let waited = 0;

    while (waited < MAX_WAIT_TIME) {
      const latestPending = await wallet.eth.getTransactionCount(
        address,
        "pending"
      );
      const latestConfirmed = await wallet.eth.getTransactionCount(
        address,
        "latest"
      );

      if (latestPending === latestConfirmed) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
      waited += interval;
    }

    if (waited >= MAX_WAIT_TIME) {
      console.log("Timeout: pending transaction not mined in time.");
      return {
        message: "Timeout: pending transaction not mined. Aborting.",
        status: false,
      };
    }

    const signedTx = await wallet.eth.accounts.signTransaction(tx, privatekey);
    const receipt = await wallet.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );

    return {
      message: `Multicall LP Add Success: https://testnet.pharosscan.xyz/tx/${receipt.transactionHash}`,
      transactionHash: receipt.transactionHash,
    };
  } catch (error) {
    return `Multicall LP Add Error: ${error.message}`;
  }
};

export default addLp;
