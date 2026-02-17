import { Router } from "express";

export async function getToolsRouter() {
	//

	const DBTable = await import("../db/db").then((r) => r.Tools);
	const router = Router();

	router.post("/", async (req, res) => {
		const user = await DBTable.create(req.body).save();
		console.log(user);

		res.json(user);
	});
	router.get("/", async (req, res) => {
		const data = await DBTable.find({});
		res.json(data);
	});
	router.get("/:id", async (req, res) => {});
	router.put("/", async (req, res) => {});
	router.delete("/", async (req, res) => {});
	//

	return {
		router,
	};
}
