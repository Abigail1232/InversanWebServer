import axios from "../axios";

export const getEntries = async (id_entry:number | null,supplier: string,user:string,store:number | string,
    startDate:string | undefined,endDate:string | undefined, page: number, pageSize: number) => {
  try {

    const response = await axios.get("api/entries", {
      params: {
        id_entry: id_entry,
        supplier: supplier,
        user: user,
        store: store?? null,
        startDate: startDate,
        endDate: endDate,
        page,
        pageSize
      }
    });
    return response.data;

  } catch (error) {
    console.error("Error obteniendo ingresos:", error);
    throw error;
  }
};

export const getEntryDetail = async (id_entry:number) => {
  try {

    const response = await axios.get(`api/entries/details/${id_entry}`);
    return response.data;

  } catch (error) {
    console.error("Error obteniendo ingresos:", error);
    throw error;
  }
};
