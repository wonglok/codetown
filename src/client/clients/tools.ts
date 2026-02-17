import axios from "axios";
import { getID } from "./db";

const baseURL = `/api/tools`;
export const Tool = {
	create: async (inbound: Record<string, any>) => {
		let data = await axios
			.post(`${baseURL}/`, {
				...inbound,
				_id: getID(),
			})
			.then((r) => r.data);

		return data;
	},
	list: async () => {
		return axios.get(`${baseURL}/`).then((r) => r.data);
	},
	get: async (id: string) => {
		return axios.get(`${baseURL}/${id}`).then((r) => r.data);
	},
	put: async (id: string, inbound: Record<string, any>) => {
		return axios.put(`${baseURL}/${id}`, inbound).then((r) => r.data);
	},
	delete: async (id: string) => {
		return axios.delete(`${baseURL}/${id}`).then((r) => r.data);
	},
};
