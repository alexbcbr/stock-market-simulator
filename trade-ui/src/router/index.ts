import { createRouter, createWebHashHistory } from 'vue-router';
import TradesView from '../views/TradesView.vue';
import MarketPricesView from '../views/MarketPricesView.vue';
import LeaderboardView from '../views/LeaderboardView.vue';

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/market-prices',
    },
    {
      path: '/market-prices',
      name: 'marketPrices',
      component: MarketPricesView,
    },
    {
      path: '/trades',
      name: 'trades',
      component: TradesView,
    },
    {
      path: '/leaderboard',
      name: 'leaderboard',
      component: LeaderboardView,
    },
  ],
});

export default router;
