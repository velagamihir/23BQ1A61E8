const axios = require("axios");
const { Log } = require("../logging_middleware/logging");

const fetchMechanics = async (url, token) => {
  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    Log("backend", "Info", "fetchMechanics", "Fetched depot data successfully");
    return response.data.depots;
  } catch (error) {
    Log("backend", "Error", "fetchMechanics", error.message);
    throw error;
  }
};

const fetchVehicles = async (url, token) => {
  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    Log(
      "backend",
      "Info",
      "fetchVehicles",
      "Fetched vehicle data successfully",
    );
    return response.data.vehicles;
  } catch (error) {
    Log("backend", "Error", "fetchVehicles", error.message);
    throw error;
  }
};

module.exports = { fetchMechanics, fetchVehicles };
