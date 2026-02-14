/* eslint-disable prefer-const */
// GaussianSplatLoader.ts
import * as THREE from "three/webgpu";
import {
	Fn,
	add,
	attribute,
	buffer,
	cameraProjectionMatrix,
	cameraViewMatrix,
	color,
	cos,
	dot,
	exp,
	hash,
	instanceIndex,
	mat4,
	mix,
	modelWorldMatrix,
	normalLocal,
	positionGeometry,
	positionLocal,
	pow,
	rand,
	range,
	sin,
	storage,
	sub,
	time,
	uniform,
	uv,
	vec3,
	vertexStage,
} from "three/tsl";
import { InstancedBufferGeometry } from "three/webgpu";

import {
	textureSize,
	uint,
	ivec2,
	vec4,
	modelViewMatrix,
	mul,
	If,
	mat3,
	transpose,
	vec2,
	length,
	max,
	normalize,
	sqrt,
	min,
	float,
	viewport,
} from "three/tsl";

//
// import type { BufferGeometry } from 'three'
//

export let setupSkinMesh = async ({
	skinnedMesh,
	mounter,
	renderer,
	onLoop,
}: any) => {
	const boundingBoxSize = new THREE.Vector3();

	skinnedMesh.geometry.boundingBox.getSize(boundingBoxSize);

	const vertexCounter = skinnedMesh.geometry.attributes.position.count;

	console.log("vertexCounter", vertexCounter);

	const particleCount = vertexCounter * 1;

	// const size = uniform(1)
	// ui.on('size', (num) => {
	//     if (typeof num === 'number') {
	//         size.value = num
	//     }
	// })

	const createBuffer = ({ itemSize = 3, type = "vec3" }) => {
		let attr = new THREE.StorageInstancedBufferAttribute(
			particleCount,
			itemSize,
		);
		let node = storage(attr, type, particleCount);
		let attribute = node.toAttribute();
		return {
			attribute,
			node,
			attr,
		};
	};

	const positionBuffer = createBuffer({ itemSize: 3, type: "vec3" });
	const velocityBuffer = createBuffer({ itemSize: 3, type: "vec3" });
	const colorBuffer = createBuffer({ itemSize: 3, type: "vec3" });
	const lifeBuffer = createBuffer({ itemSize: 3, type: "vec3" });

	const birthPositionBuffer = createBuffer({ itemSize: 3, type: "vec3" });
	const birthNormalBuffer = createBuffer({ itemSize: 3, type: "vec3" });

	const bindMatrixNode = uniform(skinnedMesh.bindMatrix, "mat4");

	// const bindMatrixInverseNode = uniform(
	//   skinnedMesh.bindMatrixInverse,
	//   "mat4"
	// );

	const boneMatricesNode = {
		node: buffer(
			skinnedMesh.skeleton.boneMatrices,
			"mat4",
			skinnedMesh.skeleton.bones.length,
		),
	};

	const skinIndexNode = createBuffer({ itemSize: 4, type: "vec4" });
	const skinWeightNode = createBuffer({ itemSize: 4, type: "vec4" });
	const processedPositionBuffer = createBuffer({
		itemSize: 3,
		type: "vec3",
	});

	// const processedNormalBuffer = createBuffer({
	//   itemSize: 3,
	//   type: "vec3",
	// });

	let geo = skinnedMesh.geometry;
	let localCount = geo.attributes.position.count;

	{
		for (let i = 0; i < particleCount; i++) {
			let yo = i % localCount;

			let x =
				geo.attributes.position.getX(yo) +
				(Math.random() * 2 - 1.0) * 0.0 * boundingBoxSize.x * 0.01;
			let y =
				geo.attributes.position.getY(yo) +
				(Math.random() * 2 - 1.0) * 0.0 * boundingBoxSize.y * 0.01;
			let z =
				geo.attributes.position.getZ(yo) +
				(Math.random() * 2 - 1.0) * 0.0 * boundingBoxSize.z * 0.01;
			birthPositionBuffer.attr.setXYZ(i, x, y, z);
			birthPositionBuffer.attr.needsUpdate = true;
		}
	}

	{
		for (let i = 0; i < particleCount; i++) {
			let yo = i % localCount;

			let x = geo.attributes.normal.getX(yo);
			let y = geo.attributes.normal.getY(yo);
			let z = geo.attributes.normal.getZ(yo);

			birthNormalBuffer.attr.setXYZ(i, x, y, z);
			birthNormalBuffer.attr.needsUpdate = true;
		}
	}

	{
		for (let i = 0; i < particleCount; i++) {
			let yo = i % localCount;

			lifeBuffer.attr.setXYZ(
				i,
				Math.random(),
				Math.random(),
				Math.random(),
			);
			lifeBuffer.attr.needsUpdate = true;
		}
	}

	{
		for (let i = 0; i < particleCount; i++) {
			let yo = i % localCount;

			let x = geo.attributes.skinIndex.getX(yo);
			let y = geo.attributes.skinIndex.getY(yo);
			let z = geo.attributes.skinIndex.getZ(yo);
			let w = geo.attributes.skinIndex.getW(yo);
			skinIndexNode.attr.setXYZW(i, x, y, z, w);
			skinIndexNode.attr.needsUpdate = true;
		}
	}

	{
		for (let i = 0; i < particleCount; i++) {
			let yo = i % localCount;

			let x = geo.attributes.skinWeight.getX(yo);
			let y = geo.attributes.skinWeight.getY(yo);
			let z = geo.attributes.skinWeight.getZ(yo);
			let w = geo.attributes.skinWeight.getW(yo);
			skinWeightNode.attr.setXYZW(i, x, y, z, w);
			skinWeightNode.attr.needsUpdate = true;
		}
	}

	let computeBone = Fn(() => {
		const position = processedPositionBuffer.node.element(instanceIndex);
		const birth = birthPositionBuffer.node.element(instanceIndex);

		const skinIndex = skinIndexNode.node.element(instanceIndex);
		const boneMatX = boneMatricesNode.node.element(skinIndex.x);
		const boneMatY = boneMatricesNode.node.element(skinIndex.y);
		const boneMatZ = boneMatricesNode.node.element(skinIndex.z);
		const boneMatW = boneMatricesNode.node.element(skinIndex.w);

		const skinVertex = bindMatrixNode.mul(birth);

		const skinWeight = skinWeightNode.node.element(instanceIndex);
		const skinned = add(
			boneMatX.mul(skinWeight.x).mul(skinVertex),
			boneMatY.mul(skinWeight.y).mul(skinVertex),
			boneMatZ.mul(skinWeight.z).mul(skinVertex),
			boneMatW.mul(skinWeight.w).mul(skinVertex),
		);
		position.assign(skinned);

		// const skinPosition = bindMatrixInverseNode.mul(skinned).xyz;
		//   .xyz.mul((1 / 100 / 10) * 2.5);

		// velocity.assign(skinPosition.sub(position).normalize().mul(0.1));
	})().compute(particleCount);

	// compute
	const computeInit = Fn(() => {
		const position = positionBuffer.node.element(instanceIndex);
		const birth = birthPositionBuffer.node.element(instanceIndex);
		const color = colorBuffer.node.element(instanceIndex);

		const randX = hash(instanceIndex);
		const randY = hash(instanceIndex.add(2));
		const randZ = hash(instanceIndex.add(3));

		position.x.assign(birth.x);
		position.y.assign(birth.y);
		position.z.assign(birth.z);

		color.assign(vec3(randX, randY, randZ));
	})().compute(particleCount);

	const mouseV3 = new THREE.Vector3(0, 1.5, 0);
	const mouseUni = uniform(mouseV3);

	const computeUpdate = Fn(() => {
		// const time = timerLocal();
		// const color = colorBuffer.node.element(instanceIndex);
		const position = positionBuffer.node.element(instanceIndex);
		const velocity = velocityBuffer.node.element(instanceIndex);
		const skinPosition =
			processedPositionBuffer.node.element(instanceIndex);
		// const skinNormal = processedNormalBuffer.node.element(instanceIndex);

		// const dist = mouseUni.sub(position).length().mul(1)

		// spinner

		velocity.addAssign(
			skinPosition
				.sub(position)
				.normalize()
				.mul(0.003 * 0.5 * 1.0),
		);

		const addVel = velocity;

		position.addAssign(addVel);

		const life = lifeBuffer.node.element(instanceIndex);

		life.addAssign(rand(position.xy).mul(-0.025));

		If(life.y.lessThan(0.01), () => {
			life.xyz.assign(vec3(1.0, 1.0, 1.0));
			velocity.assign(skinPosition.sub(position).normalize().mul(-0.009));
			position.assign(skinPosition.xyz);
		});
	});

	const computeParticles = computeUpdate().compute(particleCount);

	const velNode = velocityBuffer.node.toAttribute();
	const velAttr = velNode;
	const posAttr = positionBuffer.node.toAttribute();

	const finalColor = mix(
		color("#a2ff00"),
		color("#07c5ff"),
		velAttr.xz.length().mul(10),
	);

	const instGeometry = new InstancedBufferGeometry();
	instGeometry.instanceCount = particleCount;

	// const example = new THREE.ConeGeometry(1, 1, 3, 1, false)

	const example: any = new THREE.ConeGeometry(1, 1, 3);
	example.scale(5, 5, 5);

	// const example: any = new THREE.SphereGeometry(1, 5, 5);

	instGeometry.setAttribute(
		"position",
		new THREE.BufferAttribute(example.attributes.position.array, 3),
	);
	instGeometry.setAttribute(
		"normal",
		new THREE.BufferAttribute(example.attributes.normal.array, 3),
	);
	instGeometry.setAttribute(
		"uv",
		new THREE.BufferAttribute(example.attributes.uv.array, 2),
	);
	instGeometry.setIndex(example.index);

	const positionArray = new Float32Array(particleCount * 3);
	instGeometry.setAttribute(
		"instancePos",
		new THREE.InstancedBufferAttribute(positionArray, 3),
	);

	const lifeValue = lifeBuffer.node.element(instanceIndex);

	const material = new THREE.MeshPhysicalNodeMaterial();
	// const texture = new THREE.TextureLoader().load(``)
	material.colorNode = color("#000000");

	const velocity = velocityBuffer.node.element(instanceIndex);
	material.emissiveNode = finalColor
		.mul(lifeValue.y.abs())
		.mul(1.5)
		.mul(float(1.0).add(velocity.length().mul(1)))
		.mul(1);

	const rotation3d: (a: any, b: any) => any = Fn(
		([axis_immutable, angle]: any) => {
			const axis = axis_immutable.toVar();
			axis.assign(normalize(axis));
			const s = sin(angle);
			const c = cos(angle);
			const oc = sub(1.0, c);

			return mat4(
				oc.mul(axis.x).mul(axis.x).add(c),
				oc.mul(axis.x).mul(axis.y).sub(axis.z.mul(s)),
				oc.mul(axis.z).mul(axis.x).add(axis.y.mul(s)),
				0.0,
				oc.mul(axis.x).mul(axis.y).add(axis.z.mul(s)),
				oc.mul(axis.y).mul(axis.y).add(c),
				oc.mul(axis.y).mul(axis.z).sub(axis.x.mul(s)),
				0.0,
				oc.mul(axis.z).mul(axis.x).sub(axis.y.mul(s)),
				oc.mul(axis.y).mul(axis.z).add(axis.x.mul(s)),
				oc.mul(axis.z).mul(axis.z).add(c),
				0.0,
				0.0,
				0.0,
				0.0,
				1.0,
			);
		},
		{ axis: "vec3", angle: "float", return: "mat4" },
	);

	material.vertexNode = Fn(() => {
		//

		const velocity = velocityBuffer.node.element(instanceIndex);

		const mat4rx = rotation3d(vec3(1, 0, 0), velocity.x.mul(Math.PI * 2.0));
		const mat4ry = rotation3d(vec3(0, 1, 0), velocity.y.mul(Math.PI * 2.0));
		const mat4rz = rotation3d(vec3(0, 0, 1), velocity.z.mul(Math.PI * 2.0));

		const life = lifeBuffer.node.element(instanceIndex);

		const unitScale = pow(
			float(0)
				//
				.add(velocity.x.abs())
				.add(velocity.y.abs())
				.add(velocity.z.abs())
				.add(0.0125),
			2.1,
		)
			.mul(20)
			.mul(life.y);

		const unitGeo = positionGeometry
			.mul(unitScale)
			.mul(mat4rx)
			.mul(mat4ry)
			.mul(mat4rz);

		const centerPositionCetner = vec4(posAttr.xyz.add(vec3(unitGeo)), 1.0);

		const cameraSpaceCetner = modelViewMatrix.mul(centerPositionCetner);
		const screenCoordCetner = cameraProjectionMatrix.mul(cameraSpaceCetner);

		return vec4(screenCoordCetner);
	})();

	const mesh = new THREE.Mesh(instGeometry, material);
	mesh.frustumCulled = false;
	mesh.castShadow = false;
	mesh.receiveShadow = false;

	mounter.add(mesh);

	await renderer.computeAsync(computeInit);

	onLoop(() => {
		renderer.computeAsync(computeParticles);
		renderer.computeAsync(computeBone);
	});
};
