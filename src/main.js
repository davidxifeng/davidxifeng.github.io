"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var client_1 = require("react-dom/client");
var react_router_1 = require("@tanstack/react-router");
// Import the generated route tree
var routeTree_gen_1 = require("./routeTree.gen");
require("./styles.css");
var reportWebVitals_ts_1 = require("./reportWebVitals.ts");
// Create a new router instance
var router = (0, react_router_1.createRouter)({
    routeTree: routeTree_gen_1.routeTree,
    context: {},
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultStructuralSharing: true,
    defaultPreloadStaleTime: 0,
    basepath: process.env.NODE_ENV === "production" ? "/playground" : "/",
});
// Render the app
var rootElement = document.getElementById('app');
if (rootElement && !rootElement.innerHTML) {
    var root = client_1.default.createRoot(rootElement);
    root.render(<react_1.StrictMode>
      <react_router_1.RouterProvider router={router}/>
    </react_1.StrictMode>);
}
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
(0, reportWebVitals_ts_1.default)();
