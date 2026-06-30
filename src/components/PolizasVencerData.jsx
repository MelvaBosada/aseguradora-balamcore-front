import axios from "axios";

export const PolizasVencerData = async (dias = 999) => {
  const token = localStorage.getItem("token");
  const { data } = await axios.get(
    `/api/polizas-vencer?dias=${dias}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};
