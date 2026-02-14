"use client";

// useEffect, useMemo, useState

// import { Joystick, VirtualButton } from 'bvhecctrl'

import { Suspense, useRef, type ReactNode } from "react";
import { CanvasGPU } from "../CanvasGPU/CanvasGPU";
import { Box, Bvh, Center, Environment, Gltf } from "@react-three/drei";
import { EnvLoader } from "../CanvasGPU/EnvLoader";
import { JoystickControls } from "./JoystickControls";
import { GameSystem } from "./GameSystem";
import { useAppState } from "./useAppState";
import { AnimatedLobster } from "../SkinnedMesh/AnimatedLobster";
import { SkinedMeshEffect } from "../SkinnedMesh/SkinedMeshEffect";
import { DiamindComponent } from "../DiamondTSL/DiamondComponent";
import { BloomPipeline } from "../CanvasGPU/BloomPipeline";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
// import { SkinedMeshEffect } from '../../SkinnedMesh/SkinedMeshEffect'
// import { SkinedMeshAnimatedGLB } from '../../SkinnedMesh/SkinedMeshAnimatedGLB'
// import { AnimatedLobster } from "../../SkinnedMesh/AnimatedLobster";
// import { Overlay } from './Overlay'
// import copy from 'copy-to-clipboard'

export function GamePage() {
	const visible = useAppState((r) => r.visible);

	return (
		<div className="w-full h-full relative">
			<CanvasGPU webgpu>
				<Suspense fallback={null}>
					<Bvh firstHitOnly>
						<BloomPipeline url={`/hdr/default.hdr`}></BloomPipeline>
						{/* <EnvLoader
							//
							url={`/hdr/default.hdr`}
						></EnvLoader> */}
						{/* <Environment
							background
							files={[`/hdr/default.hdr`]}
						></Environment> */}

						<group position={[0, -1.999, 0]}>
							<Suspense fallback={null}>
								<Gltf
									castShadow
									src={`/avatar/lobsters/others/lobsterland-transformed.glb`}
								></Gltf>
							</Suspense>
						</group>

						<group visible={visible}>
							{/*  */}

							{/* <SkinedMeshAnimatedGLB
                fbxURL={`/avatar/lobsters/chef/motion/happy-state.fbx`}
                glbURL={`/avatar/lobsters/chef/mixa-lobster-transformed.glb`}
              ></SkinedMeshAnimatedGLB> */}

							<group
								name="near-water-r"
								scale={5}
								position={[
									4.046127052562055, -1.6848011016845703,
									-31.98570839489203,
								]}
							>
								<Suspense fallback={null}>
									<AnimatedLobster
										fbxURL={`/avatar/lobsters/chef/motion/twist-dance.fbx`}
										glbURL={`/avatar/lobsters/guy/lobster-mixamo-transformed.glb`}
									></AnimatedLobster>
								</Suspense>
							</group>

							<group
								name="near-water"
								scale={7}
								position={[
									-0.09289114319543201, -1.3125008792877197,
									-31.45930003386298,
								]}
							>
								<Suspense fallback={null}>
									<AnimatedLobster
										glbURL={`/avatar/lobsters/chef/mixa-lobster-transformed.glb`}
										fbxURL={`/avatar/lobsters/chef/motion/standing-clap.fbx`}
									></AnimatedLobster>
								</Suspense>

								<group
									position={[0, 1.5, 0]}
									name="lobster-mascot"
								></group>
							</group>

							<group
								name="near-water-l"
								scale={5}
								position={[
									//
									//
									-4.046127052562055, -1.6848011016845703,
									-31.98570839489203,
								]}
							>
								<Suspense fallback={null}>
									<AnimatedLobster
										glbURL={`/avatar/lobsters/lady-withdress/lady-mixamo-transformed.glb`}
										fbxURL={`/avatar/lobsters/chef/motion/happy-state.fbx`}
									></AnimatedLobster>
								</Suspense>
							</group>

							{/*  */}

							{/* <group name='near-' position={[5.540832661423739, -1.9999580383300781, -13.618021457390823]}>
                <Suspense fallback={null}>
                  <Center scale={2} top>
                    <Gltf src={`/avatar/lobsters/others/desk.glb`}></Gltf>
                  </Center>
                </Suspense>
              </group> */}
							<Suspense fallback={null}>
								<GameSystem
									glbSRC={`/env/digital-palace-loklok.glb`}
								></GameSystem>
							</Suspense>

							<Suspense fallback={null}>
								<SkinedMeshEffect masterName="lobster-mascot"></SkinedMeshEffect>
							</Suspense>

							<Suspense fallback={null}>
								<group>
									<LookAt>
										<DiamindComponent></DiamindComponent>
									</LookAt>
								</group>
							</Suspense>

							{/* <SkinedMeshEffect masterName="main-player"></SkinedMeshEffect> */}
						</group>
					</Bvh>
				</Suspense>
			</CanvasGPU>

			<JoystickControls></JoystickControls>
		</div>
	);
}

function LookAt({ children }: { children: ReactNode }) {
	const ref = useRef<Group>(null);

	useFrame((st, dt) => {
		if (ref.current) {
			ref.current.rotation.y += dt * 0.125;
		}
	});

	return <group ref={ref}>{children}</group>;
}
//
