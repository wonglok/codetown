import { useEffect, useState, type ReactNode } from "react";
import { rgbeLoader } from "./CanvasGPU";
import { useFrame, useThree } from "@react-three/fiber";
import {
	Color,
	DirectionalLight,
	EquirectangularReflectionMapping,
	Object3D,
	UnsignedByteType,
} from "three";
import { PostProcessing } from "three/webgpu";
import {
	pass,
	mrt,
	output,
	normalView,
	diffuseColor,
	velocity,
	add,
	vec3,
	vec4,
	directionToColor,
	colorToDirection,
	sample,
	float,
	mix,
	blendColor,
} from "three/tsl";
import { ssgi } from "three/addons/tsl/display/SSGINode.js";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import { traa } from "three/addons/tsl/display/TRAANode.js";
import { fxaa } from "three/addons/tsl/display/FXAANode.js";
import { useAppState } from "../World/useAppState";

export function BloomPipeline({
	//
	url,
	env = true,
}: {
	url: string;
	env?: boolean;
}) {
	const [sun, setSun] = useState<ReactNode>(null);
	const scene = useThree((r) => r.scene);
	const camera = useThree((r) => r.camera);
	const renderer = useThree((r) => r.gl);

	const [fnc, setFnc] = useState(() => {
		return () => {
			renderer.render(scene, camera);
		};
	});

	useEffect(() => {
		const object: any = new Object3D();

		const dirL = new DirectionalLight(0xffffff, 15);
		dirL.position.set(-20, 10, 0);

		object.sunLight = dirL;
		object.sunLight.castShadow = true;

		object.add(object.sunLight);
		object.add(object.sunLight.target);

		object.sunLight.castShadow = true;
		object.sunLight.shadow.camera.near = 0;
		object.sunLight.shadow.camera.far = 150 * 2;

		object.sunLight.shadow.camera.left = -5.123 * 4;
		object.sunLight.shadow.camera.right = 5.123 * 4;
		object.sunLight.shadow.camera.bottom = -5.123 * 4;
		object.sunLight.shadow.camera.top = 5.123 * 4;

		object.sunLight.shadow.mapSize.width = 512;
		object.sunLight.shadow.mapSize.height = 512;
		object.sunLight.shadow.radius = 1;
		object.sunLight.shadow.bias = -0.00035;

		const dirR = new DirectionalLight(0xffffff, 15);
		dirR.position.set(20, 10, 0);

		object.moonLight = dirR;
		object.moonLight.castShadow = false;

		object.add(object.moonLight);
		object.add(object.moonLight.target);

		object.moonLight.castShadow = false;
		object.moonLight.shadow.camera.near = 0;
		object.moonLight.shadow.camera.far = 150 * 2;

		object.moonLight.shadow.camera.left = -5.123 * 4;
		object.moonLight.shadow.camera.right = 5.123 * 4;
		object.moonLight.shadow.camera.bottom = -5.123 * 4;
		object.moonLight.shadow.camera.top = 5.123 * 4;

		object.moonLight.shadow.mapSize.width = 512;
		object.moonLight.shadow.mapSize.height = 512;
		object.moonLight.shadow.radius = 1;
		object.moonLight.shadow.bias = -0.00035;

		//
		object.sunLight.shadow.intensity = 1.0;
		object.sunLight.intensity = 5.0;
		object.moonLight.shadow.intensity = 1.0;
		object.moonLight.intensity = 5.0;

		scene.environmentIntensity = 0.35;

		const scenePass = pass(scene, camera);
		scenePass.setMRT(
			mrt({
				output: output,
				// diffuseColor: diffuseColor,
				// normal: directionToColor(normalView),
				// velocity: velocity,
			}),
		);

		const scenePassColor = scenePass.getTextureNode("output");
		// const scenePassDiffuse = scenePass.getTextureNode("diffuseColor");
		// const scenePassDepth = scenePass.getTextureNode("depth");

		// const scenePassNormal = scenePass.getTextureNode("normal");
		// const scenePassVelocity = scenePass.getTextureNode("velocity");

		// // const diffuseTexture = scenePass.getTexture('diffuseColor')
		// // diffuseTexture.type = UnsignedByteType

		// // const normalTexture = scenePass.getTexture('normal')
		// // normalTexture.type = UnsignedByteType

		// const sceneNormal = sample((uv) => {
		// 	return colorToDirection(scenePassNormal.sample(uv));
		// });

		// //

		// // gi
		// const giPass = ssgi(
		// 	scenePassColor,
		// 	scenePassDepth,
		// 	sceneNormal,
		// 	camera as any,
		// );
		// giPass.sliceCount.value = 2;
		// giPass.stepCount.value = 8;
		// giPass.backfaceLighting.value = 1;
		// giPass.radius.value = 25;
		// giPass.thickness.value = 2;

		// // composite
		// const gi = giPass.rgb;
		// const ao = giPass.a;

		// const compositePass = vec4(
		// 	add(scenePassColor.rgb.mul(ao), scenePassDiffuse.rgb.mul(gi)),
		// 	scenePassColor.a,
		// );
		// compositePass.name = "Composite";

		// // traa
		// const traaPass = traa(
		// 	compositePass,
		// 	scenePassDepth,
		// 	scenePassVelocity,
		// 	camera,
		// );

		const bloomPass = bloom(scenePassColor, 0.1, 0.2, 1.0);

		const postProcessing = new PostProcessing(renderer as any);

		const aaColor = fxaa(scenePassColor);

		postProcessing.outputNode = add(aaColor, bloomPass.mul(1.0));

		postProcessing.needsUpdate = true;

		rgbeLoader.loadAsync(url).then((texture) => {
			texture.mapping = EquirectangularReflectionMapping;
			scene.background = texture;
			scene.environment = texture;

			setSun(
				<group name="light-player-target">
					<primitive object={object}></primitive>
				</group>,
			);

			setFnc(() => {
				return () => {
					postProcessing.render();
				};
			});

			useAppState.setState({ visible: true });
		});

		return () => {
			postProcessing.dispose();
			dirL.removeFromParent();
		};
	}, [url, scene, env]);

	//
	useFrame(() => {
		fnc();
	}, 10);

	return <>{sun}</>;
}
