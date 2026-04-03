"use client";

import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

// //
// const meshes: Mesh[] = []
// import gsap from "gsap";
import {
	CameraControls,
	KeyboardControls,
	useGLTF,
	useTexture,
} from "@react-three/drei";
import BVHEcctrl, {
	characterStatus,
	StaticCollider,
	useEcctrlStore,
	type BVHEcctrlApi,
} from "bvhecctrl";
import {
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";
// import { Group, Vector3 } from 'three'
// import { useControls, folder, button } from 'leva'
import { useFrame, useThree } from "@react-three/fiber";
// import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
// import Avatar from './Avatar'
import { AvatarRPM } from "./AvatarRPM";
import { useAppState } from "./useAppState";
import {
	Color,
	PlaneGeometry,
	RepeatWrapping,
	Scene,
	TextureLoader,
	Vector2,
	Vector3,
} from "three";
import { AvatarAI } from "./AvatarAI";
import { MeshPhysicalNodeMaterial, Object3D } from "three/webgpu";
import { AvatarLobsterAI } from "./AvatarLobsterAI";
import copy from "copy-to-clipboard";
import { ObjectWater } from "./ObjectWater";
import { AvatarCuteHuman } from "./AvatarCuteHuman";
import {
	abs,
	bool,
	color,
	float,
	Fn,
	If,
	mix,
	positionWorld,
	texture,
	uniform,
	uv,
	vec3,
	vec4,
} from "three/tsl";
import { NPC } from "./NPC";
// import { Armor } from "./Armor/Armor";
// import { Armor2 } from "./Armor2/Armor2";
// import { Pulse } from "./Pulse";
// import { Armor } from "./Armor/Armor";
// import { Armor } from "./Armor/Armor";
// import { findPathByObjects } from './simple-nav'
// import { CatmullRomCurve3, Object3D, Vector3 } from 'three'
// import { gsap } from 'gsap'

export function GameSystem({ glbSRC }: { glbSRC?: string }) {
	const colliderSource = useAppState((r) => r.colliderSource);

	useEffect(() => {
		//
		ecctrlRef.current?.group?.position.set(0, 2.5, 0);
		ecctrlRef.current?.resetLinVel();
		ecctrlRef.current?.setLinVel(new Vector3(0, 7.5, 0));

		setTimeout(() => {
			const tt = setInterval(() => {
				if (ecctrlRef.current) {
					clearInterval(tt);

					ecctrlRef.current?.resetLinVel();
					ecctrlRef.current?.setLinVel(new Vector3(0, 7.5, 0));
					ecctrlRef.current?.group?.position.set(0, 2.5, 0);
				}
			}, 1);
		}, 5);
		//
		//
	}, []);

	const colliderMeshesArray = useEcctrlStore(
		(state) => state.colliderMeshesArray,
	);

	const camControlRef = useRef<CameraControls | null>(null);

	const ecctrlRef = useRef<BVHEcctrlApi | null>(null);

	const keyboardMap = useMemo(() => {
		return [
			{ name: "forward", keys: ["ArrowUp", "KeyW"] },
			{ name: "backward", keys: ["ArrowDown", "KeyS"] },
			{ name: "leftward", keys: ["ArrowLeft", "KeyA"] },
			{ name: "rightward", keys: ["ArrowRight", "KeyD"] },
			{ name: "jump", keys: ["Space"] },
			{ name: "run", keys: ["Shift"] },
		];
	}, []);

	useFrame((state, delta) => {
		if (camControlRef.current && ecctrlRef.current) {
			if (ecctrlRef.current.group) {
				camControlRef.current.moveTo(
					ecctrlRef.current.group.position.x,
					ecctrlRef.current.group.position.y + 0.35,
					ecctrlRef.current.group.position.z,
					true,
				);
			}

			if (ecctrlRef.current.group) {
				if (ecctrlRef.current.group.position.y <= -50) {
					ecctrlRef.current?.resetLinVel();
					ecctrlRef.current?.setLinVel(new Vector3(0, 7.5, 0));
					ecctrlRef.current?.group?.position.set(0, 2.5, 0);
				}
			}

			const target = state.scene.getObjectByName("light-player-target");
			if (target && ecctrlRef.current.group) {
				target.position.copy(ecctrlRef.current.group.position);
			}

			if (ecctrlRef.current.group) {
				ecctrlRef.current.group.visible =
					camControlRef.current.distance > 0.8;
			}
		}
	});

	const chosenPlayerAvatar = useAppState((r) => r.chosenPlayerAvatar);

	return (
		<>
			<CameraControls
				maxDistance={30}
				ref={camControlRef}
				smoothTime={0.1}
				azimuthRotateSpeed={1}
				colliderMeshes={colliderMeshesArray}
				makeDefault
			/>

			<>
				<KeyboardControls map={keyboardMap}>
					<group position={[0, 0, 0]}>
						<Suspense fallback={null}>
							<BVHEcctrl
								ref={ecctrlRef}
								position={[0, 5, 0]}
								maxWalkSpeed={3.5}
								colliderCapsuleArgs={[0.3, 0.8, 4, 8]}
							>
								{/*  */}

								{/* <AvatarRPM></AvatarRPM> */}

								{/*  */}

								{/* {chosenPlayerAvatar === "school-girl" && (
									<>
										<group position={[0, 0.15, 0]}>
											<Suspense fallback={null}>
												<AvatarCuteHuman
													model={`/avatar/human/school-girl-transformed.glb`}
												></AvatarCuteHuman>
											</Suspense>
										</group>
									</>
								)}
								{chosenPlayerAvatar === "school-boy" && (
									<>
										<group position={[0, 0.15, 0]}>
											<Suspense fallback={null}>
												<AvatarCuteHuman
													model={`/avatar/human/school-boy-transformed.glb`}
												></AvatarCuteHuman>
											</Suspense>
										</group>
									</>
								)} */}

								{chosenPlayerAvatar === "girl" && (
									<>
										<group position={[0, 0.15, 0]}>
											<Suspense fallback={null}>
												<AvatarCuteHuman
													model={`/avatar/human/girl-transformed.glb`}
												></AvatarCuteHuman>
											</Suspense>
										</group>
									</>
								)}

								{chosenPlayerAvatar === "boy" && (
									<>
										<group position={[0, 0.15, 0]}>
											<Suspense fallback={null}>
												<AvatarCuteHuman
													model={`/avatar/human/boy-transformed.glb`}
												></AvatarCuteHuman>
											</Suspense>
										</group>
									</>
								)}

								{/* <group position={[0, 0.0, 0]}>
									<Suspense fallback={null}>
										<Armor2></Armor2>
									</Suspense>
								</group> */}

								{/* {chosenPlayerAvatar === "army" && (
									<>
										<group position={[0, 0, 0]}>
											<AvatarAI></AvatarAI>
										</group>
									</>
								)}

								{chosenPlayerAvatar === "guy" && (
									<>
										<group position={[0, 0.15, 0]}>
											<Suspense fallback={null}>
												<AvatarLobsterAI
													// lobsterURL={`/avatar/lobsters/guy/lobster-mixamo-transformed.glb`}
													lobsterURL={`/avatar/lobsters/cowboy/mixamo-cowbody-rigged-transformed.glb`}
													//
												></AvatarLobsterAI>
											</Suspense>
										</group>
									</>
								)}

								{chosenPlayerAvatar === "lady" && (
									<>
										<group position={[0, 0.075, 0]}>
											<Suspense fallback={null}>
												<AvatarLobsterAI
													lobsterURL={`/avatar/lobsters/lady-withdress/lady-mixamo-transformed.glb`}
												></AvatarLobsterAI>
											</Suspense>
										</group>
									</>
								)} */}

								<group name="main-player"></group>
							</BVHEcctrl>
						</Suspense>
					</group>
				</KeyboardControls>

				<StaticCollider uuid={colliderSource?.uuid}>
					<group visible={true}>
						<group
							{...(process.env.NODE_ENV === "development"
								? {
										onClick: (ev) => {
											//
											const pt =
												ev.intersections[0]?.point.toArray();
											console.log("obj", pt);
											//
											copy(
												`<group name="near-" position={${JSON.stringify(pt)}}>\n\n\t<Suspense fallback={null}>\n\n\n\n\n\t</Suspense>\n\n</group>`,
											);
										},
									}
								: {})}
						>
							{glbSRC && <ContentGL glbSRC={glbSRC}></ContentGL>}
						</group>
					</group>
				</StaticCollider>

				<Suspense fallback={null}>
					<group position={[0, 0, 0]}>
						<ObjectWater></ObjectWater>
					</group>
				</Suspense>

				<group
					name="near-left"
					position={[-3, -1.9999580383300781, -4.664016388831336]}
				>
					<Suspense fallback={null}>
						<NPC
							onClick={() => {
								//
								useAppState.setState({
									overlay: "create-program",
								});
								console.log("Create Program");
							}}
							banner={`Create Program`}
							avatarURL={`/avatar/human/school-boy-transformed.glb`}
							idleURL={`/avatar/human/human-motion/idle.fbx`}
						></NPC>
					</Suspense>
				</group>

				<group
					name="near-right"
					position={[3, -1.9999580383300781, -4.66916632184862]}
				>
					<Suspense fallback={null}>
						<NPC
							onClick={() => {
								console.log("Chat with Agent");
								useAppState.setState({
									overlay: "chat-agent",
								});
								//
							}}
							banner={`Chat with Agent`}
							avatarURL={`/avatar/human/school-girl-transformed.glb`}
							idleURL={`/avatar/human/human-motion/idle.fbx`}
						></NPC>
					</Suspense>
				</group>
			</>
		</>
	);
}

// { "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }

function ContentGL({ glbSRC }: { glbSRC: string }) {
	const glb = useGLTF(glbSRC) as any;

	const cloned = useMemo(() => {
		return clone(glb?.scene) as any;
	}, [glb?.scene?.uuid]);

	useEffect(() => {
		useAppState.setState({
			colliderSource: cloned,
		});
	}, [cloned.uuid]);

	const { nodes, materials } = glb;

	const [colorNode, setColorNode] = useState(() => {
		return vec4(color("#fbf8d3"));
	});
	const [emissiveNode, setEmissiveNode] = useState(() => {
		return vec4(0.0);
	});

	// console.log(materials)

	// /textures/chip/Chip005_4K-PNG_Color.png
	// /textures/chip/Chip005_4K-PNG_Metalness.png
	// /textures/chip/Chip005_4K-PNG_NormalGL.png
	// /textures/chip/Chip005_4K-PNG_Roughness.png
	const textProps = useTexture(
		{
			// emissiveMap: `/textures/chip/Chip005_4K-PNG_Color.png`,
			// map: `/textures/chip/Chip005_4K-PNG_Color.png`,
			metalnessMap: `/textures/chip/Chip005_4K-PNG_Metalness.png`,
			roughnessMap: `/textures/chip/Chip005_4K-PNG_Roughness.png`,
			normalMap: `/textures/chip/Chip005_4K-PNG_NormalGL.png`,
			displacementMap: `/textures/chip/Chip005_1K-JPG_Displacement.jpg`,
		},
		(tex) => {
			Object.values(tex).forEach((tex2) => {
				tex2.repeat.set(15, 15);
				tex2.wrapS = tex2.wrapT = RepeatWrapping;
			});
		},
	);

	const mat = useMemo(() => {
		const val = new MeshPhysicalNodeMaterial();

		val.setValues({
			map: materials.Inner_plaza.map,
			metalness: 0.65,
			roughness: 0.25,
			metalnessMap: textProps.normalMap,
			normalMap: textProps.normalMap,
			normalScale: new Vector2(2.5, 2.5),
			emissiveNode: emissiveNode,
		});

		return val;
	}, [textProps]);

	const wall = useMemo(() => {
		const val = new MeshPhysicalNodeMaterial({});

		val.setValues({
			map: materials.Outer_ring.map,
			metalness: 0.7,
			roughness: 0.25,
			metalnessMap: textProps.normalMap,
			normalMap: textProps.normalMap,
			normalScale: new Vector2(1, 1),
			emissiveNode: emissiveNode,
		});

		return val;
	}, [textProps]);

	const middle = useMemo(() => {
		const val = new MeshPhysicalNodeMaterial();

		val.setValues({
			color: new Color("#ffcd7d"),
			metalness: 0.7,
			roughness: 0.25,
			metalnessMap: textProps.normalMap,
			normalMap: textProps.normalMap,
			normalScale: new Vector2(1, 1),
		});

		return val;
	}, [textProps]);

	const detail = useMemo(() => {
		const val = new MeshPhysicalNodeMaterial({});

		val.setValues({
			color: new Color("#000"),
			emissive: new Color("#ff923f"),
			emissiveIntensity: 3,
			metalness: 0,
		});

		return val;
	}, [textProps]);

	return (
		<group dispose={null} position={[0, -2, 0]}>
			{/* <Pulse setEmissiveNode={setEmissiveNode}></Pulse> */}
			{/*  */}

			<mesh
				castShadow
				receiveShadow
				geometry={nodes.metal.geometry}
				material={detail}
			/>
			{/* <mesh castShadow receiveShadow geometry={nodes.inner.geometry} material={materials.Inner_plaza} /> */}
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.inner.geometry}
				material={mat}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.wall.geometry}
				material={wall}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.glass.geometry}
				material={materials.Glass}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.trees.geometry}
				material={materials.Tress}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.inner001.geometry}
				material={middle}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.waterpond.geometry}
				material={materials.water}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.waterpond001.geometry}
				material={materials.Inner_plaza}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.waterpond002.geometry}
				material={materials.water}
				position={[0, 0.103, 0]}
			/>
		</group>
	);

	// return (
	//   <>
	//     <group
	//       onClick={(ev) => {
	//         console.log('clicked', ev.point.toArray(), ev.object.name)
	//       }}
	//     >
	//       <primitive object={cloned}></primitive>
	//     </group>
	//   </>
	// )
}

//
