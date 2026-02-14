import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

export function AnimatedLobster({
	glbURL = `/avatar/lobsters/chef/mixa-lobster-transformed.glb`,
	fbxURL = `/avatar/lobsters/chef/motion/thriller3.fbx`,
}) {
	const motion = {
		motion1: useFBX(fbxURL),
	};
	const glb = useGLTF(glbURL);

	const glbScene = useMemo(() => {
		const o3d = clone(glb.scene);

		o3d.traverse((it) => {
			//
			it.castShadow = true;
			//
			it.receiveShadow = true;
		});

		const dispaly = <primitive object={o3d}></primitive>;
		return {
			o3d: o3d,
			dispaly,
		};
	}, [glb.scene]);

	const ani = useAnimations([...motion.motion1.animations], glbScene.o3d);

	useEffect(() => {
		ani.actions[ani.names[0] as string]?.play();
	}, [ani]);

	return (
		<>
			<group castShadow>{glbScene.dispaly}</group>
		</>
	);
}
