import "./App.css";

// import reactLogo from "./assets/react.svg";

// import { useEffect, useState } from "react";

// import { getChatSocket, getGenericSocket } from "./clients/socket";

//

import { GamePage } from "../components/3d/World/GamePage";

import {
	BrowserRouter as Router,
	Switch,
	Route,
	Link,
	useRouteMatch,
	useParams,
} from "react-router-dom";

import "nprogress/nprogress.css";

import { LMStudioManager } from "./adapter/LMStudioManager";

function App() {
	return (
		<div className="w-full h-full">
			<Router>
				<>
					<nav className=" fixed z-20 top-0 left-0 bg-white p-3 m-3">
						<ul>
							<li>
								<Link to="/">Home</Link>
							</li>
							<li>
								<Link to="/ai">Settings</Link>
							</li>
							{/* <li>
								<Link to="/topics">Topics</Link>
							</li> */}
						</ul>
					</nav>

					<Switch>
						<Route path="/ai">
							<LMStudioManager></LMStudioManager>
						</Route>
						<Route path="/topics">
							<Topics></Topics>
						</Route>
						<Route path="/">
							<LMStudioManager
								showOK={<GamePage></GamePage>}
							></LMStudioManager>
						</Route>
					</Switch>
				</>
			</Router>
		</div>
	);
}

function Topics() {
	const match = useRouteMatch();

	return (
		<div>
			<h2>Topics</h2>

			<ul className="p-2 bg-gray-200">
				<li>
					<Link to={`${match.url}/components`}>Components</Link>
				</li>
				<li>
					<Link to={`${match.url}/props-v-state`}>
						Props v. State
					</Link>
				</li>
			</ul>

			<Switch>
				<Route path={`${match.path}/:topicId`}>
					<Topic />
				</Route>
				<Route path={match.path}>
					<h3>Please select a topic.</h3>
				</Route>
			</Switch>
		</div>
	);
}

function Topic() {
	const { topicId }: any = useParams();

	return <h3>Requested topic ID: {topicId}</h3>;
}

export default App;

//
