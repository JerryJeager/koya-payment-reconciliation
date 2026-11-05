// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");
const { setFloat64 } = require("node:ffi");

let total = 0;
let count = 0;

let cleanedTxns = new Map();

const lines = fs
  .readFileSync("payments.jsonl", "utf8")
  .split("\n")
  .filter((l) => l.length > 0);
for (const line of lines) {
  let event;
  try {
    event = JSON.parse(line);
  } catch (error) {
    continue;
  }
  if (event.txn_id) {
    if (!cleanedTxns.has(event.txn_id)) {
      cleanedTxns.set(event.txn_id, event);
    } else {
      let newTxnTs = new Date(event.ts);
      let oldTxnTs = new Date(cleanedTxns.get(event.txn_id).ts);
      if (newTxnTs > oldTxnTs) {
        cleanedTxns.set(event.txn_id, event);
      }
    }
  }
}


let successfullTxns = new Map(
  Array.from(cleanedTxns).filter((txn) => {
    if (txn[1].status === "success"){
      let amount = parseFloat(txn[1].amount)
      if(amount != NaN){
        total += amount
      }
    }
    return txn[1].status === "success"
  }),
);
count = successfullTxns.size;


const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(
    `Check failed: counted ${count} successful payments, expected ${expected}.`,
  );
  console.log(
    "Something in the data isn't being handled the way the README describes.",
  );
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
