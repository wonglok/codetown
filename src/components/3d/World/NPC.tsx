import {
	Center,
	RoundedBoxGeometry,
	Text3D,
	useAnimations,
	useFBX,
	useGLTF,
} from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { helvetica } from "./font/helvetica";
import { Object3D } from "three";

export function NPC({
	avatarURL = "",
	idleURL = "",
	banner = "",
	onClick = () => {},
}) {
	let glb: any = useGLTF(avatarURL);
	let idle = useFBX(idleURL);
	let cloned = useMemo(() => {
		return clone(glb?.scene || new Object3D());
	}, [glb.scene]);

	let anim = useAnimations(idle.animations, cloned);

	useEffect(() => {
		anim.actions[anim?.names[0] as string]?.play();
	}, []);

	useFrame((_, dt) => {
		anim.mixer.update(dt);
	});

	//

	return (
		<>
			{/*  */}
			<group scale={1.5}>
				{/*  */}
				{<primitive object={cloned}></primitive>}

				{/*  */}
			</group>
			{/*  */}

			<group
				position={[0, 2.5, 0]}
				onLostPointerCapture={(ev) => {
					ev.stopPropagation();
				}}
				scale={0.65}
				onClick={onClick}
			>
				<mesh scale={[1, 1, 0.15]}>
					<RoundedBoxGeometry
						args={[
							1 * (1 + 1.5 + banner.length / 3.5),
							1 * (1 + 0.5),
							1,
						]}
						radius={0.25}
					></RoundedBoxGeometry>
					<meshStandardMaterial
						roughness={0.1}
						metalness={0.5}
					></meshStandardMaterial>
				</mesh>

				<Center
					key={banner + "center"}
					scale={0.5}
					position={[0, 0, 0.1]}
				>
					<Text3D font={helvetica as any}>
						{`${banner}`}
						<meshStandardMaterial
							roughness={0.1}
							metalness={0.5}
							color={"#464646"}
						></meshStandardMaterial>
					</Text3D>
				</Center>
			</group>
		</>
	);
}
