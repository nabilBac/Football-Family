import { Router } from "./router.js";
import { Auth } from "../../jss/auth.js";

document.addEventListener("DOMContentLoaded", async () => {
    await Auth.loadUser();  
    await Router.init();
});
