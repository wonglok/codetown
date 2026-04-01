import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useCallback, useEffect, useMemo } from "react";
import { Object3D } from "three";
import {
	bool,
	color,
	float,
	Fn,
	If,
	mix,
	positionWorld,
	uniform,
	vec3,
	vec4,
} from "three/tsl";

export function Pulse({ setColorNode, setEmissiveNode }: any) {
	const scene = useThree((r) => r.scene);
	const tasks: any[] = useMemo(() => {
		return [];
	}, []);
	useFrame((_, dt) => {
		tasks.forEach((ts) => ts(_, dt));
	});
	const onLoop = useCallback(
		(fnc: any) => {
			tasks.push(fnc);
		},
		[tasks],
	);

	const { emissiveNode } = useMemo(() => {
		const getEmissiveNode = ({ duration = 1, delay = 0 }) => {
			const mainPlayer = new Object3D();
			const playerPos = uniform(mainPlayer.position);
			onLoop(() => {
				//
			});

			const outer = uniform(0);
			const thickness = uniform(0.1);
			const brightness = uniform(1);

			let loop = async () => {
				let player = scene.getObjectByName("main-player");
				if (player) {
					player.getWorldPosition(mainPlayer.position);
				}

				brightness.value = 0;
				outer.value = 0;
				gsap.to(brightness, {
					value: 20,
					duration: duration,
					ease: "power2.inOut",
					onUpdate: () => {},
					onStart: () => {},
					onComplete: () => {},
				});

				await gsap.to(outer, {
					value: 2.0,
					duration: duration,
					delay: delay,
					ease: "power2.inOut",
					onUpdate: () => {},
					onStart: () => {},
					onComplete: () => {},
				});

				await gsap.to(brightness, {
					value: 0,
					duration: 0.3,
					ease: "power2.inOut",
					onUpdate: () => {},
					onStart: () => {},
					onComplete: () => {},
				});

				//
			};

			let emissiveNode = Fn(() => {
				//
				const base = "#000000";
				const colorOut = color(base).toVar();

				const dist = playerPos.xyz.sub(positionWorld.xyz).length();

				If(bool(false), () => {})
					.ElseIf(
						dist
							.lessThanEqual(outer)
							.and(dist.greaterThanEqual(outer.sub(thickness))),
						() => {
							const greenCol = color("#29ffd1");
							const baseCol = color(base);
							const diff = dist.sub(outer.sub(thickness));
							const outfade = diff.div(thickness);
							const infade = float(1.0).sub(outfade);

							colorOut.assign(
								mix(
									greenCol,
									baseCol,
									float(1).sub(infade.mul(outfade)),
								),
							);
						},
					)
					.Else(() => {
						//
						// colorOut.assign(color(materials.Inner_plaza.color));
						//
					});

				return colorOut.mul(brightness);
			})();

			let api = {
				loop,
				free: true,
				run: () => {
					api.free = false;
					loop().then(() => {
						api.free = true;
					});
				},
				emissiveNode,
			};
			return api;
		};

		const allColors = Fn(() => {
			const emissiveNode = vec3(0.0).toVar();

			const list = [
				getEmissiveNode({
					duration: 1.5,
				}),
				getEmissiveNode({
					duration: 1.5,
				}),
				getEmissiveNode({
					duration: 1.5,
				}),
				getEmissiveNode({
					duration: 1.5,
				}),
				getEmissiveNode({
					duration: 1.5,
				}),
				getEmissiveNode({
					duration: 1.5,
				}),
				getEmissiveNode({
					duration: 1.5,
				}),
				getEmissiveNode({
					duration: 1.5,
				}),
				getEmissiveNode({
					duration: 1.5,
				}),
				getEmissiveNode({
					duration: 1.5,
				}),
			];

			list.forEach((li) => {
				emissiveNode.addAssign(vec3(li.emissiveNode));
			});

			setInterval(() => {
				let free = list.find((r) => r.free);

				if (free) {
					free?.run();
				} else {
					//
				}
			}, 250);

			return emissiveNode;
		})();

		return { emissiveNode: allColors };
	}, []);

	useEffect(() => {
		setEmissiveNode(emissiveNode);

		return () => {
			setEmissiveNode(color("#000000"));
		};
	}, [emissiveNode]);

	// useEffect(() => {
	// 	setColorNode(colorNode);

	// 	return () => {
	// 		setColorNode(color("#fbf8d3"));
	// 	};
	// }, [colorNode]);

	return null;
}
