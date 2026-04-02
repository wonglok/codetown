"use client";

import { useEffect } from "react";
import { useAppState } from "./useAppState";

export function Overlay() {
	const overlay = useAppState((r) => r.overlay);

	useEffect(() => {
		if (overlay) {
			let hr = (ev: any) => {
				if (ev.key === "Escape") {
					//
					useAppState.setState({ overlay: "" });
				}
			};
			window.addEventListener("keydown", hr);
			return () => {
				window.removeEventListener("keydown", hr);
			};
		}
	}, [overlay]);

	return (
		<>
			{overlay && (
				<>
					<div
						className=" absolute z-20 top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center"
						onClick={() => {
							useAppState.setState({
								overlay: "",
							});
						}}
					></div>
				</>
			)}

			{overlay === "create-program" && (
				<>
					{/*  */}
					<div
						className=" absolute  bg-white  z-30 rounded-2xl"
						style={{
							width: `90%`,
							height: `90%`,
							left: "5%",
							top: `5%`,
						}}
					>
						<div className=""></div>
					</div>
					{/*  */}
				</>
			)}

			{overlay === "chat-agent" && (
				<>
					{/*  */}
					<div
						className=" absolute  bg-white  z-30 rounded-2xl"
						style={{
							width: `90%`,
							height: `90%`,
							left: "5%",
							top: `5%`,
						}}
					>
						<div className=""></div>
					</div>
					{/*  */}
				</>
			)}
		</>
	);
}
