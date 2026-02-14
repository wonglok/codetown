import { Box } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimationMixer, Clock, Mesh, Object3D, Sprite, Vector3 } from "three";
import {
	float,
	Fn,
	hash,
	If,
	instancedArray,
	instanceIndex,
	mix,
	shapeCircle,
	uniform,
	uv,
	vec3,
} from "three/tsl";
import { WebGPURenderer } from "three/webgpu";
import {
	DRACOLoader,
	FBXLoader,
	GLTFLoader,
} from "three/examples/jsm/Addons.js";
import { setupSkinMesh } from "../SkinnedMesh/SkinnedMeshParticles";

export function SkinedMeshEffect({ masterName = "pet01" }) {
	const [api, setAPI] = useState<any>({
		glb: false,
		isReady: false,
		update: (st: any, dt: number) => {},
		hit: (evt?: any) => {},
		clickPosition: uniform(new Vector3()),
		display: <group></group>,
		o3d: new Object3D(),
	});
	const gl: WebGPURenderer = useThree((r) => r.gl) as any;
	// const scene = useThree((r) => r.scene)

	const gp = useRef<Mesh>(null);
	//   const player = useGame((r) => r.player)
	const v3 = new Vector3();
	useFrame((st, dt) => {
		if (api.isReady) {
			if (gp.current) {
				st.raycaster.setFromCamera(st.pointer, st.camera);

				const res = st.raycaster.intersectObject(gp.current, false);

				if (res[0]) {
					api.clickPosition.value.copy(res[0].point);
					api.hit();
				}
			}
			api.update(st, dt);
		}

		const player = st.scene.getObjectByName(masterName);
		if (player && api.glb) {
			//
			player.getWorldPosition(api.glb.scene.position);
			player.getWorldQuaternion(api.glb.scene.quaternion);

			v3.set(0, 0, -0.25);
			v3.applyQuaternion(api.glb.scene.quaternion);
			api.glb.scene.position.add(v3);

			//

			api.glb.scene.rotation.y += Math.PI * 0.0;

			api.glb.scene.scale.setScalar((1 / 50) * 10);
			// api.glb.scene.position.y += 5;

			// api.
		}
	});

	useEffect(() => {
		let clean = () => {};

		const run = async () => {
			const clickPosition = uniform(new Vector3());
			const tasks: any[] = [];
			const onLoop = (fn: any) => {
				tasks.push(fn);
			};
			const mounter = new Object3D();

			const draco = new DRACOLoader();
			draco.setDecoderPath("/draco/");
			const loader = new GLTFLoader();
			loader.setDRACOLoader(draco);

			// const fbx = new FBXLoader()
			// const run = await fbx.loadAsync(`/exp/locomotion/run.fbx`)

			loader
				.loadAsync(`/skin/wing1.glb`)
				// .loadAsync(`/exp/rpm-loklok.glb`)
				// .loadAsync(`/exp/avatar/Chick_Animations.glb`)
				// .loadAsync(`/exp/avatar/Rooster_Animatdions.glb`)
				//
				.then(async (glb) => {
					glb.scene.traverse((it: any) => {
						if (it.isSkinnedMesh) {
							setupSkinMesh({
								skinnedMesh: it,
								mounter: mounter,
								renderer: gl,
								onLoop: onLoop,
							});

							// if (it.material) {
							//   it.material.depthWrite = true
							//   it.material.depthTest = true
							//   it.material.opacity = 1
							//   it.material.wireframe = false
							// }

							if (it.material) {
								it.material.depthWrite = false;
								it.material.depthTest = false;
								it.material.opacity = 0;
								it.material.wireframe = true;
							}
						}
					});
					//

					mounter.add(glb.scene);

					const mixer = new AnimationMixer(glb.scene);

					const action =
						glb.animations.find((r) =>
							`${r.name}`.toLowerCase().includes("fly"),
						) || glb.animations[0];
					if (action) {
						const anim = mixer.clipAction(action, glb.scene);
						anim.play();
						const clock = new Clock();
						onLoop(() => {
							mixer.update(clock.getDelta());
						});

						setAPI({
							glb: glb as any,
							isReady: true,

							clickPosition: clickPosition,
							o3d: mounter,
							update: (st: any, dt: number) => {
								tasks.forEach((t) => t(st, dt));
							},
							hit: () => {},
							display: <primitive object={mounter}></primitive>,
						});
					}
				});

			//

			return () => {
				setAPI((r: any) => {
					return { ...r, isReady: false };
				});
			};
		};

		run().then((v) => {
			clean = v;
		});

		return () => {
			clean();
		};
	}, [setupSkinMesh]);

	return (
		<>
			<group position={[0, 0, 0]}>
				{api.display}

				<Box
					ref={gp}
					visible={false}
					scale={[100, 0.01, 100]}
					position={[0, -1.5, 0]}
					onPointerMove={(evt) => {
						// api.clickPosition.value.copy(evt.point)
					}}
				></Box>
			</group>
		</>
	);
}
