const swapABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "collectionAndSelfcalls",
        type: "uint256",
      },
      {
        internalType: "bytes[]",
        name: "data",
        type: "bytes[]",
      },
    ],
    name: "multicall",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export default swapABI;
