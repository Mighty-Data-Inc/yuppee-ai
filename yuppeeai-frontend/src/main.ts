import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { initializeAuth } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

initializeAuth({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  messagingSenderId: import.meta.env
    .VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
});

const authStore = useAuthStore(pinia);
authStore.initializeAuthListener();
authStore.hydrateFromCurrentUser();

app.mount("#app");
