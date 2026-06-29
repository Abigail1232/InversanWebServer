import axios from "../axios";

export const getWarehouses = async () => {
  try {

    const response = await axios.get("/api/bodegas");

    return response.data;

  } catch (error) {

    console.error("Error obteniendo bodegas", error);
    throw error;

  }
};
