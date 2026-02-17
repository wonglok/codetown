"use client";

// import { Canvas } from '@react-three/fiber'
import { useAppState } from "./useAppState";
// import { Environment, PerspectiveCamera, Stage, View } from '@react-three/drei'
// import { AnimatedLobster } from '../../SkinnedMesh/AnimatedLobster'
// import { Suspense } from 'react'
import { Button } from "@/components/ui/button";
// import { CanvasGPU } from '../CanvasGPU/CanvasGPU'
import Image from "next/image";

export function Overlay() {
	const overlay = useAppState((r) => r.overlay);

	return (
		<>
			{overlay === "avatarpicker" && (
				<div className=" absolute z-20 top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center">
					<div className="text-white w-full">
						<div className="flex w-full">
							<div className="w-full">
								<div className="flex justify-center  items-center flex-col lg:flex-row gap-4">
									<Image
										className="w-8/12 lg:w-1/3 aspect-square rounded-2xl cursor-pointer"
										width={500}
										height={500}
										src={`/avatar/lobsters/lady-withdress/lady.png`}
										alt="lady lobster with dress"
										onClick={() => {
											useAppState.setState({
												overlay: "",
												chosenPlayerAvatar: "lady",
											});
										}}
									></Image>
									<Image
										className="w-8/12 lg:w-1/3 aspect-square rounded-2xl cursor-pointer"
										width={500}
										height={500}
										src={`/avatar/lobsters/cowboy/cowboy.jpeg`}
										alt="lady lobster with dress"
										onClick={() => {
											useAppState.setState({
												overlay: "",
												chosenPlayerAvatar: "guy",
											});
										}}
									></Image>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}

export const AvatarPickerButton = () => {
	return (
		<Button
			variant="outline"
			className="h-[40px] z-20 mr-2"
			onClick={() => {
				///

				useAppState.setState({
					overlay: "avatarpicker",
				});
			}}
		>
			Clothes
		</Button>
	);
};
