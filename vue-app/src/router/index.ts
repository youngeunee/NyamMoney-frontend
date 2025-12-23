// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Signup from '../views/users/Signup.vue'
import Me from '../views/users/Mypage.vue'
import Analytics from '../views/Analytics.vue'
import Organization from '../views/Organization.vue'
import Projects from '../views/Projects.vue'
import Transactions from '../views/Transactions.vue'
import Invoices from '../views/Invoices.vue'
import Payments from '../views/Payments.vue'
import Members from '../views/Members.vue'
import Permissions from '../views/Permissions.vue'
import Chat from '../views/Chat.vue'
import FollowList from '../views/follow/followList.vue'
import Help from '../views/Help.vue'
import { useAuthStore } from '../stores/auth'
import Login from '../views/users/Login.vue'
import UserProfileView from '../views/users/UserProfileView.vue'
import ChallengeListView from '../views/challenges/ChallengeListView.vue'
import TransactionCreateView from '../views/TransactionCreateView.vue'
import TransactionDetailView from '../views/TransactionDetailView.vue'
import TransactionEditView from '../views/TransactionEditView.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: Login },
  { path: '/signup', name: 'Signup', component: Signup },
  { path: '/help', name: 'Help', component: Help },

  { path: '/dashboard', name: 'Dashboard', component: Home, meta: { requiresAuth: true } },
  { path: '/me', name: 'Me', component: Me, meta: { requiresAuth: true } },
  { path: '/analytics', name: 'Analytics', component: Analytics, meta: { requiresAuth: true } },
  { path: '/projects', name: 'Projects', component: Projects, meta: { requiresAuth: true } },
  { path: '/transactions', name: 'Transactions', component: Transactions, meta: { requiresAuth: true } },
  { path: '/transactions/new', name: 'TransactionCreate', component: TransactionCreateView, meta: { requiresAuth: true } },
  { path: '/transactions/:transactionId', name: 'TransactionDetail', component: TransactionDetailView, meta: { requiresAuth: true }, props: true },
  { path: '/transactions/:transactionId/edit', name: 'TransactionEdit', component: TransactionEditView, meta: { requiresAuth: true }, props: true },
  { path: '/invoices', name: 'Invoices', component: Invoices, meta: { requiresAuth: true } },
  { path: '/payments', name: 'Payments', component: Payments, meta: { requiresAuth: true } },
  { path: '/members', name: 'Members', component: Members, meta: { requiresAuth: true } },
  { path: '/permissions', name: 'Permissions', component: Permissions, meta: { requiresAuth: true } },
  { path: '/chat', name: 'Chat', component: Chat, meta: { requiresAuth: true } },
  { path: '/profile', name: 'UserProfile', component: UserProfileView, meta: { requiresAuth: true } },
  { path: '/follows', name: 'FollowList', component: FollowList, meta: { requiresAuth: true } },
  {
    path: '/boards/:boardId/posts/:postId/edit',
    name: 'postEdit',
    component: () => import('@/views/posts/PostEditView.vue'),
    props: (route) => ({
      boardId: Number(route.params.boardId),
      postId: Number(route.params.postId),
    }),
  },
  {
    path: '/challenges/:challengeId',
    name: 'challengeDetail',
    component: () => import('@/views/challenges/ChallengeDetailView.vue'),
    props: (route) => ({
      challengeId: Number(route.params.challengeId),
    }),
  },
  {
    path: '/challenges/new',
    name: 'challengeCreate',
    component: () => import('@/views/challenges/ChallengeCreateView.vue'),
  },
  {
    path: '/organization',
    name: 'Organization',
    redirect: { name: 'boardPosts', params: { boardId: 1 } },
    component: Organization,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'boards/:boardId',
        name: 'boardPosts',
        component: () => import('@/views/boards/BoardPostsView.vue'),
        props: (route) => ({
          boardId: Number(route.params.boardId),
        }),
      },
      {
        path: 'boards/:boardId/posts/new',
        name: 'newPost',
        component: () => import('@/views/boards/PostCreateView.vue'),
        props: true,
      },
      {
        path: 'boards/:boardId/posts/:postId',
        name: 'postDetail',
        component: () => import('@/views/posts/PostDetailView.vue'),
        props: true,
      },
    ],
  },
  {
    path: '/challenges/:challengeId/edit',
    name: 'challengeEdit',
    component: () => import('@/views/challenges/ChallengeEditView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

let restored = false

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  if (!restored) {
    restored = true
    Promise.resolve(auth.restoreFromRefresh?.() ?? auth.setAuthFromToken())
      .finally(() => {
        if (to.meta.requiresAuth && !auth.isAuthenticated) {
          next({ path: '/login' })
        } else {
          next()
        }
      })
    return
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next({ path: '/login' })
  }

  return next()
})

export default router
