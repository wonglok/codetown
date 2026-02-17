import { type NavMesh } from "navcat";
import { Group } from "three";
import { create } from "zustand";
export const useAppState = create(() => {
	return {
		visible: false as boolean,
		colliderSource: null as Group | null,
		//
		navMesh: null as NavMesh | null,
		chosenPlayerAvatar: "boy",
		overlay: "avatarpicker",
	};
});
