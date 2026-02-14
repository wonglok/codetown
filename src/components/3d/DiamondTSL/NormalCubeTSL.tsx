import { vec3, normalLocal, vec4 } from "three/tsl"; // Or 'three/nodes' if using addons setup

import {
	BufferGeometry,
	CubeCamera,
	CubeTexture,
	DoubleSide,
	Mesh,
	MeshBasicNodeMaterial,
	RGBAFormat,
	WebGLCubeRenderTarget,
} from "three/webgpu";
import { Scene } from "three/webgpu";
import { Fn } from "three/src/nodes/TSL.js";
// import * as THREE from 'three'
// import { color } from 'three/tsl' // Adjust exact import path per your Three.js version

export const buildCubeNormal = ({
	geometry,
	gl,
}: {
	gl: any;
	geometry: BufferGeometry;
}): CubeTexture | any => {
	const renderTarget = new WebGLCubeRenderTarget(512, {
		format: RGBAFormat,
	});

	const camera = new CubeCamera(0.01, 10, renderTarget as any);
	const scene = new Scene();
	scene.add(camera);

	const normalMaterial = new MeshBasicNodeMaterial();
	normalMaterial.outputNode = Fn(() => {
		const color = vec3(normalLocal.normalize()).mul(0.5).add(0.5);
		return vec4(color.rgb, 1.0);
	})();

	normalMaterial.side = DoubleSide;

	const mesh = new Mesh(geometry, normalMaterial);
	scene.add(mesh);

	camera.update(gl, scene);

	return renderTarget.texture;
};

//
//
//
