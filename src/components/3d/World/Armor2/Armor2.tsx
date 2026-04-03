import glbURL from "./armor-transformed.glb?url";

import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useAnimationStore } from "bvhecctrl";
import { useEffect, useMemo, useRef, useState } from "react";
import { LoopOnce } from "three";

import idle from "./locomo/idle-business.fbx?url";
import jogging from "./locomo/jogging.fbx?url";
import walking from "./locomo/walking.fbx?url";

import jumpup from "./locomo/jump-up.fbx?url";
import jumpdown from "./locomo/jump-down.fbx?url";
import falling from "./locomo/falling-idle.fbx?url";

// import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

export function Armor2({}) {
	const ecctrlActionName = useAnimationStore(
		(state) => state.animationStatus,
	);
	const [canPlayNext, setCanPlayNext] = useState(true);
	const prevActionNameRef = useRef("IDLE");

	const fbx = {
		start: useFBX(`${jumpup}`),
		land: useFBX(`${jumpdown}`),
		loop: useFBX(`${falling}`),

		//
		idle: useFBX(`${idle}`),
		run: useFBX(`${jogging}`),
		walk: useFBX(`${walking}`),
	};

	const glb = useGLTF(glbURL);

	// glb.scene.traverse((it) => {
	//   if (it) {
	//     // it.name = it.name.replace('mixamorig', '')
	//   }
	// })

	const clips = useMemo(() => {
		return [
			...fbx.idle.animations.map((r) => {
				r.name = "IDLE";
				return r;
			}),
			...fbx.walk.animations.map((r) => {
				r.name = "WALK";

				let track = r.tracks.find((r) =>
					r.name.includes("Hips.position"),
				);
				if (track) {
					for (let i = 0; i < track?.values?.length - 1; i += 3) {
						if (track) {
							// track.values[i + 0] = 0;
							// // track.values[i + 1] = 0;
							// track.values[i + 2] = 0;
						}
					}
					console.log(track);
				}

				return r;
			}),
			...fbx.run.animations.map((r) => {
				r.name = "JOG";

				let track = r.tracks.find((r) =>
					r.name.includes("Hips.position"),
				);
				if (track) {
					for (let i = 0; i < track?.values?.length - 1; i += 3) {
						if (track) {
							// track.values[i + 0] = 0;
							// track.values[i + 1] = 0;
							// track.values[i + 2] = 0;
						}
					}
					console.log(track);
				}

				return r;
			}),
			//
			//
			//
			...fbx.start.animations.map((r) => {
				r.name = "JUMP_START";
				return r;
			}),
			...fbx.loop.animations.map((r) => {
				r.name = "JUMP_LOOP";
				return r;
			}),
			...fbx.land.animations.map((r) => {
				r.name = "JUMP_LAND";
				return r;
			}),
		];
	}, []);

	const { ref, actions, mixer }: any = useAnimations(clips, glb.scene);

	//

	useEffect(() => {
		if (actions["IDLE"]) {
			actions["IDLE"].play();
		}
	}, [actions]);

	const statusToActionMap = useMemo(() => {
		return {
			IDLE: "IDLE",
			WALK: "WALK",
			RUN: "JOG",
			JUMP_START: "JUMP_START",
			JUMP_IDLE: "JUMP_LOOP",
			JUMP_FALL: "JUMP_LOOP",
			JUMP_LAND: "JUMP_LAND",
		};
	}, []);

	useEffect(() => {
		const nextActionName = statusToActionMap[ecctrlActionName];
		const nextAction = actions[nextActionName];
		if (!nextAction) {
			return;
		}

		const prevActionName = prevActionNameRef.current;

		if (nextActionName !== prevActionName && canPlayNext) {
			if (
				nextActionName === statusToActionMap.JUMP_START ||
				nextActionName === statusToActionMap.JUMP_LAND
			) {
				setCanPlayNext(false);
				nextAction.timeScale = 0.5;
				nextAction
					.reset()
					.crossFadeFrom(actions[prevActionName], 0.1)
					.setLoop(LoopOnce, 1)
					.play();
				nextAction.clampWhenFinished = true;
			} else {
				setCanPlayNext(true);
				nextAction.timeScale = 1;
				nextAction
					.reset()
					.crossFadeFrom(actions[prevActionName], 0.2)
					.play();
			}

			prevActionNameRef.current = nextActionName;
		}

		/**
		 * For one-time animations, we set special conditions to allow next action to be played
		 */
		// If jump start is not finished, and ecctrlActionName is not jump start or jump idle, allow next action
		// if ecctrlActionName is jump start or jump idle, continue to wait for jump start to finish
		if (
			!canPlayNext &&
			prevActionName === statusToActionMap.JUMP_START &&
			ecctrlActionName !== "JUMP_IDLE" &&
			ecctrlActionName !== "JUMP_START"
		) {
			setCanPlayNext(true);
		}

		// If jump land is not finished, and ecctrlActionName is not idle or jump land, allow next action
		// if ecctrlActionName is idle or jump land, continue to wait for jump land to finish
		if (
			!canPlayNext &&
			prevActionName === statusToActionMap.JUMP_LAND &&
			ecctrlActionName !== "IDLE" &&
			ecctrlActionName !== "JUMP_LAND"
		) {
			setCanPlayNext(true);
		}

		if (ecctrlActionName === "RUN" && nextAction) {
			nextAction.timeScale = 0.45;
		}
		if (ecctrlActionName === "WALK" && nextAction) {
			nextAction.timeScale = 0.45;
		}
		if (ecctrlActionName === "JUMP_START" && nextAction) {
			nextAction.timeScale = 0.5 * 2;
		}
		if (ecctrlActionName === "JUMP_LAND" && nextAction) {
			nextAction.timeScale = 0.44 * 2;
		}
		if (ecctrlActionName === "JUMP_IDLE" && nextAction) {
			nextAction.timeScale = 0;
		}
		if (ecctrlActionName === "JUMP_FALL" && nextAction) {
			nextAction.timeScale = 0;
		}
	}, [ecctrlActionName, canPlayNext]);

	useEffect(() => {
		const onFinished = (e: any) => {
			if (
				!canPlayNext &&
				(e.action._clip.name === statusToActionMap.JUMP_START ||
					e.action._clip.name === statusToActionMap.JUMP_LAND)
			) {
				setCanPlayNext(true);
			}
		};

		mixer.addEventListener("finished", onFinished);
		return () => {
			mixer.removeEventListener("finished", onFinished);
		};
	}, [canPlayNext]);

	useFrame((st, dt) => {
		mixer.update(dt);
	});

	useEffect(() => {
		glb.scene.traverse((it) => {
			if (it) {
				it.castShadow = true;
				it.receiveShadow = true;
				it.frustumCulled = false;
			}

			console.log(it.name);
			if (it.name === "hands001") {
				it.visible = false;
			}
			if (it.name === "feets001") {
				it.visible = false;
			}
			if (it?.material) {
				if (it?.material.name === "armor") {
					it.material.metalness = 0.0;
					it.material.roughness = 1.0;
				}
			}
		});
	}, [glb]);

	return (
		<>
			<group
				frustumCulled={false}
				name="main-player-glb"
				rotation={[-0.5 * Math.PI, 0, 0]}
				scale={2}
				position={[0, -0.9, 0]}
			>
				<primitive object={glb.scene}></primitive>
			</group>
			<group position={[0, -0.9, 0]}>
				<group ref={ref} visible={false} dispose={null}>
					<primitive object={fbx.idle}></primitive>
					<primitive object={fbx.walk}></primitive>
					<primitive object={fbx.run}></primitive>
					<primitive object={fbx.start}></primitive>
					<primitive object={fbx.loop}></primitive>
					<primitive object={fbx.land}></primitive>
				</group>
			</group>
		</>
	);
}
