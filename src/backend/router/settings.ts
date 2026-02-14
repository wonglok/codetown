import { Router } from "express";

export async function getSettingsRouter() {
	//
	const router = Router();

	router.get("/", (req, res) => {});
	router.get("/:id", (req, res) => {});
	router.put("/", (req, res) => {});
	router.post("/", (req, res) => {});
	router.delete("/", (req, res) => {});
	//

	return {
		router,
	};
}
