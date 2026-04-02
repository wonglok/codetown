import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

export function NPC({ avatarURL, idleURL }) {
	let glb = useGLTF(avatarURL);
	let idle = useFBX(idleURL);
	let cloned = useMemo(() => {
		return clone(glb.scene);
	}, [glb.scene]);
	let anim = useAnimations(idle.animations, cloned);

	useEffect(() => {
		anim.actions[anim.names[0]].play();
	}, []);
	useFrame((_, dt) => {
		anim.mixer.update(dt);
	});
	return (
		<>
			{/*  */}
			<group scale={1.5}>
				{/*  */}
				{<primitive object={cloned}></primitive>}

				{/*  */}
			</group>
			{/*  */}
		</>
	);
}
