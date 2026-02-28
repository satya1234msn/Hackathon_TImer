const fs = require("fs");
const path = require("path");

const statePath = path.join(__dirname, "..", "timer-state.json");
const initialState = {
  startedAt: null
};

fs.writeFileSync(statePath, `${JSON.stringify(initialState, null, 2)}\n`, "utf8");
console.log("Timer state reset to 24:00:00.");
