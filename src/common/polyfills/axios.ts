// Force axios to use its browser build in MV3 / worker environments.
// Some upstream packages resolve axios to the node CJS build, which pulls in
// Node builtins (crypto/url) and form-data, causing the service worker to crash.
import axios from "axios-browser";

export default axios;
