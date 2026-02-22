import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useAnimationStore } from "bvhecctrl";
import { useEffect, useMemo, useRef, useState } from "react";
import { LoopOnce } from "three";

export function AvatarCuteHuman({
	model = `/avatar/human/boy-transformed.glb`,
}) {
	const ecctrlActionName = useAnimationStore(
		(state) => state.animationStatus,
	);
	const [canPlayNext, setCanPlayNext] = useState(true);
	const prevActionNameRef = useRef("IDLE");

	const fbx = {
		start: useFBX(`/avatar/human/human-motion/jump-up.fbx`),
		loop: useFBX(`/avatar/human/human-motion/falling-idle.fbx`),
		land: useFBX(`/avatar/human/human-motion/jump-down.fbx`),

		//
		idle: useFBX(`/avatar/human/human-motion/idle.fbx`),
		run: useFBX(`/avatar/human/human-motion/running.fbx`),
		walk: useFBX(`/avatar/human/human-motion/walking.fbx`),
	};

	const glb = useGLTF(model);

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
				return r;
			}),
			...fbx.run.animations.map((r) => {
				r.name = "JOG";
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
		});
	}, [glb]);

	return (
		<>
			<group
				frustumCulled={false}
				name="main-player-glb"
				rotation={[0 * Math.PI, 0, 0]}
				scale={1.5}
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
