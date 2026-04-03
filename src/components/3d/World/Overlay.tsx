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
						className=" cursor-pointer absolute z-20 top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center"
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
					<div
						className=" absolute  bg-white  z-30 rounded-2xl overflow-hidden"
						style={{
							width: `calc(100% - 80px)`,
							height: `calc(100% - 80px)`,
							left: "40px",
							top: `40px`,
						}}
					>
						<div className="w-full h-full bg-gray-200">123</div>
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
							width: `calc(100% - 80px)`,
							height: `calc(100% - 80px)`,
							left: "40px",
							top: `40px`,
						}}
					>
						<div className=""></div>
					</div>
					{/*  */}
				</>
			)}

			{overlay && (
				<>
					<div
						className=" cursor-pointer  absolute z-40 top-0 right-0  bg-red-500 flex justify-center items-center"
						//

						style={{
							width: `calc(40px)`,
							height: `calc(40px)`,
							right: "20px",
							top: `20px`,
							borderRadius: "40px",
						}}
						//
						onClick={() => {
							useAppState.setState({
								overlay: "",
							});
						}}
					>
						<svg
							className="fill-white"
							clipRule="evenodd"
							fillRule="evenodd"
							strokeLinejoin="round"
							strokeMiterlimit="2"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="m12.002 2.005c5.518 0 9.998 4.48 9.998 9.997 0 5.518-4.48 9.998-9.998 9.998-5.517 0-9.997-4.48-9.997-9.998 0-5.517 4.48-9.997 9.997-9.997zm0 1.5c-4.69 0-8.497 3.807-8.497 8.497s3.807 8.498 8.497 8.498 8.498-3.808 8.498-8.498-3.808-8.497-8.498-8.497zm0 7.425 2.717-2.718c.146-.146.339-.219.531-.219.404 0 .75.325.75.75 0 .193-.073.384-.219.531l-2.717 2.717 2.727 2.728c.147.147.22.339.22.531 0 .427-.349.75-.75.75-.192 0-.384-.073-.53-.219l-2.729-2.728-2.728 2.728c-.146.146-.338.219-.53.219-.401 0-.751-.323-.751-.75 0-.192.073-.384.22-.531l2.728-2.728-2.722-2.722c-.146-.147-.219-.338-.219-.531 0-.425.346-.749.75-.749.192 0 .385.073.531.219z"
								fillRule="nonzero"
							/>
						</svg>
					</div>
				</>
			)}
		</>
	);
}
