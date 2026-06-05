const { fetchMechanics, fetchVehicles } = require("../models/depotModel");
const constants = require("../constants");

async function getAllocations() {
  const depots = await fetchMechanics(
    constants.mechanicsFetchUrl,
    constants.token,
  );
  const allTasks = await fetchVehicles(
    constants.vehiclesFetchUrl,
    constants.token,
  );

  return depots.map((depot) => {
    const depotId = String(depot.ID);
    const capacityInMinutes = Math.round(Number(depot.MechanicHours || 0) * 60);

    const tasksForDepot = allTasks.filter((task) =>
      Object.values(task).some((value) => String(value) === depotId),
    );

    const durations = tasksForDepot.map((t) =>
      Math.round(Number(t.duration || t.Duration || 0) * 60),
    );
    const impacts = tasksForDepot.map((t) => Number(t.impact || t.Impact || 0));

    const dp = new Array(capacityInMinutes + 1).fill(0);
    const selectedMatrix = Array.from(
      { length: tasksForDepot.length },
      () => new Uint8Array(capacityInMinutes + 1),
    );

    for (let i = 0; i < tasksForDepot.length; i++) {
      const duration = durations[i];
      const impact = impacts[i];

      if (duration <= 0) continue;

      for (let cap = capacityInMinutes; cap >= duration; cap--) {
        if (dp[cap - duration] + impact > dp[cap]) {
          dp[cap] = dp[cap - duration] + impact;
          selectedMatrix[i][cap] = 1;
        }
      }
    }

    const selectedTasks = [];
    let remainingCapacity = capacityInMinutes;
    for (let i = tasksForDepot.length - 1; i >= 0; i--) {
      if (selectedMatrix[i] && selectedMatrix[i][remainingCapacity]) {
        selectedTasks.push(tasksForDepot[i]);
        remainingCapacity -= durations[i];
      }
    }

    return {
      depotId,
      selectedTasks,
      totalTimeHours: (capacityInMinutes - remainingCapacity) / 60,
      totalImpact: dp[capacityInMinutes],
    };
  });
}

module.exports = { getAllocations };
