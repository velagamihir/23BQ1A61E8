const { getAllocations } = require("../services/depotService");

async function allocateTasks(req, res) {
  try {
    const allocations = await getAllocations();
    return res.status(200).json({ success: true, allocations });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { allocateTasks };
