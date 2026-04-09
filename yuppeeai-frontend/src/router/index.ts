import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import SearchView from "@/views/SearchView.vue";
import AccountStatusRefreshView from "@/views/AccountStatusRefreshView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/search",
      name: "search",
      component: SearchView,
    },
    {
      path: "/account-status-refresh",
      name: "account-status-refresh",
      component: AccountStatusRefreshView,
    },
  ],
});

export default router;
