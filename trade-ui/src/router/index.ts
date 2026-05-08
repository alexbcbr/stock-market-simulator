import { createRouter, createWebHashHistory } from 'vue-router';
import TradesView from '../views/TradesView.vue';
import MarketPricesView from '../views/MarketPricesView.vue';
import LeaderboardView from '../views/LeaderboardView.vue';

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'trades',
      component: TradesView,
    },
    {
      path: '/market-prices',
      name: 'marketPrices',
      component: MarketPricesView,
    },
    {
      path: '/leaderboard',
      name: 'leaderboard',
      component: LeaderboardView,
    },
  ],
});

export default router;
