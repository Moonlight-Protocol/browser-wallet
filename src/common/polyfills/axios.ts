// Force axios to use its browser build in MV3 / worker environments.
// Some upstream packages resolve axios to the node CJS build, which pulls in
// Node builtins (crypto/url) and form-data, causing the service worker to crash.
import axios from "axios-browser";

// MV3 service workers do not have XMLHttpRequest — only fetch is available.
// The axios browser build defaults to the XHR adapter, which fails instantly
// with "Network Error" in a service worker context. Force the fetch adapter.
axios.defaults.adapter = "fetch";

export default axios;
