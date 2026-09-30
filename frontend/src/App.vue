<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api, { setAuthToken } from './services/api'

const user = ref(null)
const items = ref([])
const users = ref([])
const activeView = ref('overview')
const search = ref('')
const isLoading = ref(false)
const isItemFormOpen = ref(false)
const editingId = ref(null)
const errorMessage = ref('')
const notice = ref('')
const credentials = reactive({ username: '', password: '' })
const itemDraft = reactive({ title: '', description: '' })

const roleName = computed(() => user.value?.role || '')
const todayLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
const canCreate = computed(() => ['admin', 'editor'].includes(roleName.value))
const visibleItems = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return items.value
  return items.value.filter((item) => `${item.title} ${item.description} ${item.createdBy?.username}`.toLowerCase().includes(query))
})
const ownItems = computed(() => items.value.filter((item) => item.createdBy?._id === user.value?.id || item.createdBy?.id === user.value?.id))
const canManage = (item) => roleName.value === 'admin'
  || (roleName.value === 'editor' && (item.createdBy?._id === user.value?.id || item.createdBy?.id === user.value?.id))
const roleLabel = (role) => role.charAt(0).toUpperCase() + role.slice(1)

async function loadDashboard() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const [{ data: itemData }, userData] = await Promise.all([
      api.get('/items'),
      roleName.value === 'admin' ? api.get('/users') : Promise.resolve(null),
    ])
    items.value = itemData.items
    users.value = userData?.data.users || []
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Could not load dashboard data.'
  } finally {
    isLoading.value = false
  }
}

async function signIn() {
  errorMessage.value = ''
  isLoading.value = true
  try {
    const { data } = await api.post('/auth/login', credentials)
    setAuthToken(data.token)
    user.value = data.user
    activeView.value = 'overview'
    await loadDashboard()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Unable to sign in. Check that the API is running.'
  } finally {
    isLoading.value = false
  }
}

async function signOut() {
  try {
    await api.post('/auth/logout')
  } catch (_error) {
    // The stateless token is cleared locally even if the API is offline.
  }
  setAuthToken(null)
  user.value = null
  items.value = []
  users.value = []
  activeView.value = 'overview'
}

function startCreate() {
  editingId.value = null
  itemDraft.title = ''
  itemDraft.description = ''
  isItemFormOpen.value = true
}

function startEdit(item) {
  editingId.value = item._id
  itemDraft.title = item.title
  itemDraft.description = item.description
  isItemFormOpen.value = true
}

async function saveItem() {
  errorMessage.value = ''
  try {
    if (editingId.value) {
      await api.put(`/items/${editingId.value}`, itemDraft)
      notice.value = 'Item updated.'
    } else {
      await api.post('/items', itemDraft)
      notice.value = 'Item created.'
    }
    isItemFormOpen.value = false
    await loadDashboard()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Could not save this item.'
  }
}

async function deleteItem(item) {
  if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return
  errorMessage.value = ''
  try {
    await api.delete(`/items/${item._id}`)
    notice.value = 'Item deleted.'
    await loadDashboard()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Could not delete this item.'
  }
}

async function updateRole(targetUser, event) {
  const role = event.target.value
  errorMessage.value = ''
  try {
    const { data } = await api.put(`/users/${targetUser._id}/role`, { role })
    targetUser.role = data.user.role
    if (targetUser._id === user.value.id) {
      user.value.role = data.user.role
      if (user.value.role !== 'admin') activeView.value = 'overview'
    }
    notice.value = `${targetUser.username}'s role is now ${roleLabel(role)}.`
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Could not update this role.'
    event.target.value = targetUser.role
  }
}

onMounted(async () => {
  const token = localStorage.getItem('rbac-token')
  if (!token) return
  setAuthToken(token)
  try {
    const { data } = await api.get('/auth/me')
    user.value = data.user
    await loadDashboard()
  } catch (_error) {
    setAuthToken(null)
  }
})
</script>

<template>
  <main v-if="!user" class="login-layout">
    <section class="login-story">
      <div class="wordmark"><span class="wordmark-mark">R</span> Relay<span class="wordmark-light">/</span>board</div>
      <div class="story-copy">
        <p class="eyebrow">WORKSPACE ACCESS / 01</p>
        <h1>Good work,<br>well <em>governed.</em></h1>
        <p class="story-description">One shared workspace. The right tools for every role.</p>
      </div>
      <div class="story-bottom"><span>RBAC WORKSPACE</span><span>BUILD 01.26</span></div>
      <div class="story-stamp" aria-hidden="true">R</div>
    </section>

    <section class="login-panel">
      <div class="login-panel-top"><span>MEMBER SIGN IN</span><span class="status-dot">SYSTEM READY</span></div>
      <form class="login-form" @submit.prevent="signIn">
        <div class="form-heading">
          <p class="eyebrow">WELCOME BACK</p>
          <h2>Sign in to Relayboard</h2>
          <p>Use your workspace credentials to continue.</p>
        </div>
        <label for="username">Username</label>
        <input id="username" v-model="credentials.username" autocomplete="username" placeholder="e.g. editor" required>
        <label for="password">Password</label>
        <input id="password" v-model="credentials.password" autocomplete="current-password" type="password" placeholder="Enter your password" required>
        <p v-if="errorMessage" class="inline-error" role="alert">{{ errorMessage }}</p>
        <button class="button button-primary sign-in-button" type="submit" :disabled="isLoading">
          {{ isLoading ? 'Connecting...' : 'Continue to workspace' }} <span aria-hidden="true">↗</span>
        </button>
      </form>
      <div class="demo-access">
        <div class="demo-heading"><span>DEMO ACCESS</span><span>SELECT TO FILL</span></div>
        <div class="demo-accounts">
          <button type="button" class="demo-account" @click="Object.assign(credentials, { username: 'admin', password: 'admin123' })">
            <span class="demo-role role-admin">A</span><span><strong>Admin</strong><small>Full workspace access</small></span><span class="demo-arrow">↗</span>
          </button>
          <button type="button" class="demo-account" @click="Object.assign(credentials, { username: 'editor', password: 'editor123' })">
            <span class="demo-role role-editor">E</span><span><strong>Editor</strong><small>Create and edit own work</small></span><span class="demo-arrow">↗</span>
          </button>
          <button type="button" class="demo-account" @click="Object.assign(credentials, { username: 'viewer', password: 'viewer123' })">
            <span class="demo-role role-viewer">V</span><span><strong>Viewer</strong><small>Read-only workspace</small></span><span class="demo-arrow">↗</span>
          </button>
        </div>
      </div>
      <p class="login-footnote">Demo data is created when the API first connects to MongoDB.</p>
    </section>
  </main>

  <div v-else class="app-shell">
    <aside class="sidebar">
      <a class="wordmark sidebar-brand" href="#overview" @click.prevent="activeView = 'overview'"><span class="wordmark-mark">R</span> Relay<span class="wordmark-light">/</span>board</a>
      <div class="workspace-label"><span class="workspace-icon">R</span><span><strong>Relay Studio</strong><small>Product workspace</small></span><span class="workspace-chevron">⌄</span></div>
      <p class="nav-label">WORKSPACE</p>
      <nav class="main-nav" aria-label="Workspace navigation">
        <button :class="{ selected: activeView === 'overview' }" @click="activeView = 'overview'"><span class="nav-glyph">◫</span> Overview <span class="nav-count">01</span></button>
        <button :class="{ selected: activeView === 'items' }" @click="activeView = 'items'"><span class="nav-glyph">▤</span> All items <span class="nav-count">{{ items.length.toString().padStart(2, '0') }}</span></button>
        <button v-if="user.role === 'admin'" :class="{ selected: activeView === 'users' }" @click="activeView = 'users'"><span class="nav-glyph">◎</span> People <span class="nav-count">{{ users.length.toString().padStart(2, '0') }}</span></button>
      </nav>
      <div class="sidebar-bottom">
        <div class="access-card"><span class="access-indicator"></span><div><small>ACCESS LEVEL</small><strong>{{ roleLabel(user.role) }}</strong></div><span class="access-pill">ACTIVE</span></div>
        <button class="profile-button" @click="signOut"><span class="avatar">{{ user.username.slice(0, 1).toUpperCase() }}</span><span class="profile-name"><strong>{{ user.username }}</strong><small>{{ roleLabel(user.role) }} account</small></span><span class="profile-exit">↗</span></button>
      </div>
    </aside>

    <main class="main-content">
      <header class="topbar">
        <div class="breadcrumbs"><span>Relay Studio</span><span>/</span><strong>{{ activeView === 'overview' ? 'Overview' : activeView === 'users' ? 'People' : 'All items' }}</strong></div>
        <div class="topbar-meta"><span class="live-indicator"></span> ALL SYSTEMS NORMAL <span class="topbar-divider"></span><span>{{ todayLabel }}</span></div>
      </header>

      <div class="content-wrap">
        <div v-if="errorMessage" class="alert alert-error" role="alert"><span>{{ errorMessage }}</span><button aria-label="Dismiss error" @click="errorMessage = ''">×</button></div>
        <div v-if="notice" class="alert alert-success" role="status"><span>{{ notice }}</span><button aria-label="Dismiss notification" @click="notice = ''">×</button></div>

        <template v-if="activeView !== 'users'">
          <section class="page-heading">
            <div>
              <p class="eyebrow">{{ activeView === 'overview' ? 'YOUR WORKSPACE' : 'SHARED LIBRARY' }} <span class="heading-slash">/</span> {{ roleLabel(user.role).toUpperCase() }} VIEW</p>
              <h1>{{ activeView === 'overview' ? `Welcome back, ${user.username}.` : 'All items.' }}</h1>
              <p class="page-subtitle">{{ activeView === 'overview' ? "Here's the latest from your workspace." : 'Browse current work across the workspace.' }}</p>
            </div>
            <button v-if="canCreate" class="button button-primary create-button" @click="startCreate"><span class="plus">+</span> New item</button>
          </section>

          <section class="stats-grid" :class="`stats-${user.role}`" aria-label="Workspace statistics">
            <article class="stat-block"><div class="stat-label">{{ user.role === 'admin' ? 'TOTAL ITEMS' : 'WORKSPACE ITEMS' }}<span>↗</span></div><strong class="stat-value">{{ items.length.toString().padStart(2, '0') }}</strong><span class="stat-foot">Across the workspace</span><div class="stat-bar"><i :style="{ width: `${Math.min(items.length * 12, 92)}%` }"></i></div></article>
            <article class="stat-block"><div class="stat-label">{{ user.role === 'admin' ? 'TEAM MEMBERS' : user.role === 'editor' ? 'YOUR ITEMS' : 'ACCESS MODE' }}<span>↗</span></div><strong class="stat-value">{{ user.role === 'admin' ? users.length.toString().padStart(2, '0') : user.role === 'editor' ? ownItems.length.toString().padStart(2, '0') : 'READ' }}</strong><span class="stat-foot">{{ user.role === 'admin' ? 'People with workspace access' : user.role === 'editor' ? 'Created by you' : 'No editing permissions' }}</span><div class="stat-bar stat-bar-olive"><i :style="{ width: `${user.role === 'admin' ? Math.min(users.length * 15, 92) : user.role === 'editor' ? Math.min(ownItems.length * 20, 92) : 28}%` }"></i></div></article>
            <article v-if="user.role === 'admin'" class="stat-block stat-highlight"><div class="stat-label">ACTIVE ROLES<span>↗</span></div><strong class="stat-value">03</strong><span class="stat-foot">Admin · Editor · Viewer</span><div class="role-dots"><i></i><i></i><i></i></div></article>
            <article v-else class="stat-block"><div class="stat-label">YOUR ROLE<span>↗</span></div><strong class="stat-value stat-role">{{ roleLabel(user.role) }}</strong><span class="stat-foot">Permissions are managed by an admin</span><div class="role-dots"><i></i><i></i><i></i></div></article>
          </section>

          <section class="items-section">
            <div class="section-heading">
              <div><p class="eyebrow">{{ activeView === 'overview' ? 'RECENT ACTIVITY' : 'WORKSPACE CONTENT' }}</p><h2>{{ activeView === 'overview' ? 'Latest items' : 'Item library' }} <span class="heading-count">{{ visibleItems.length.toString().padStart(2, '0') }}</span></h2></div>
              <label class="search-box"><span aria-hidden="true">⌕</span><input v-model="search" aria-label="Search items" placeholder="Search items"><kbd>/</kbd></label>
            </div>

            <div v-if="isItemFormOpen" class="item-editor">
              <div class="editor-heading"><div><p class="eyebrow">{{ editingId ? 'UPDATE ITEM' : 'NEW WORKSPACE ITEM' }}</p><h3>{{ editingId ? 'Edit item' : 'Create an item' }}</h3></div><button class="close-button" aria-label="Close form" @click="isItemFormOpen = false">×</button></div>
              <form class="item-form" @submit.prevent="saveItem">
                <label>Title<input v-model="itemDraft.title" maxlength="120" required placeholder="Give this work a clear name"></label>
                <label>Description<textarea v-model="itemDraft.description" maxlength="2000" required rows="3" placeholder="What should the team know?"></textarea></label>
                <div class="editor-actions"><button type="button" class="button button-quiet" @click="isItemFormOpen = false">Cancel</button><button class="button button-primary" :disabled="isLoading">{{ editingId ? 'Save changes' : 'Create item' }}</button></div>
              </form>
            </div>

            <div class="items-table-head"><span>ITEM / DESCRIPTION</span><span>CREATED BY</span><span>DATE ADDED</span><span>ACCESS</span></div>
            <div v-if="isLoading && !items.length" class="empty-state">Loading workspace...</div>
            <div v-else-if="!visibleItems.length" class="empty-state"><strong>{{ search ? 'No matches found.' : 'Nothing here yet.' }}</strong><span>{{ search ? 'Try a different search term.' : canCreate ? 'Create the first item to get started.' : 'Items shared with you will appear here.' }}</span></div>
            <article v-for="(item, index) in (activeView === 'overview' ? visibleItems.slice(0, 8) : visibleItems)" :key="item._id" class="item-row">
              <div class="item-main"><span class="item-index">{{ (index + 1).toString().padStart(2, '0') }}</span><div><strong>{{ item.title }}</strong><p>{{ item.description }}</p></div></div>
              <div class="item-creator"><span class="creator-avatar">{{ item.createdBy?.username?.slice(0, 1).toUpperCase() || '?' }}</span>{{ item.createdBy?.username || 'Unknown' }}<span v-if="item.createdBy?.role === 'admin'" class="creator-you">ADMIN</span></div>
              <time class="item-date" :datetime="item.createdAt">{{ new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}</time>
              <div class="item-actions">
                <span v-if="user.role === 'viewer'" class="permission-tag permission-read">READ ONLY</span>
                <span v-else-if="user.role === 'editor' && !canManage(item)" class="permission-tag permission-read">VIEW ONLY</span>
                <template v-else><span class="permission-tag permission-edit">{{ user.role === 'admin' ? 'FULL ACCESS' : 'YOUR ITEM' }}</span><button class="row-action" :aria-label="`Edit ${item.title}`" title="Edit item" @click="startEdit(item)">Edit</button><button v-if="user.role === 'admin'" class="row-action row-delete" :aria-label="`Delete ${item.title}`" title="Delete item" @click="deleteItem(item)">Delete</button></template>
              </div>
            </article>
            <div v-if="activeView === 'overview' && visibleItems.length > 8" class="table-footer"><span>Showing 8 of {{ visibleItems.length }} items</span><button @click="activeView = 'items'">View all items <span>↗</span></button></div>
            <div v-else class="table-footer"><span>Showing {{ visibleItems.length }} {{ visibleItems.length === 1 ? 'item' : 'items' }}</span><span>Permissions enforced by workspace role</span></div>
          </section>
          <footer class="page-footer"><span>RELAYBOARD WORKSPACE</span><span>YOUR ACCESS: {{ roleName.toUpperCase() }}</span></footer>
        </template>

        <section v-else class="people-view">
          <div class="page-heading"><div><p class="eyebrow">WORKSPACE SETTINGS <span class="heading-slash">/</span> ADMIN ONLY</p><h1>People &amp; access.</h1><p class="page-subtitle">Manage who can see and change workspace data.</p></div></div>
          <div class="people-summary"><span class="people-summary-mark">◎</span><div><strong>{{ users.length }} members</strong><span>Roles determine what each person can do.</span></div><span class="admin-only-tag">ADMIN ACCESS</span></div>
          <div class="people-table-head"><span>MEMBER</span><span>ROLE</span><span>JOINED</span><span>PERMISSIONS</span></div>
          <article v-for="person in users" :key="person._id" class="people-row">
            <div class="person-cell"><span class="creator-avatar person-avatar">{{ person.username.slice(0, 1).toUpperCase() }}</span><div><strong>{{ person.username }} <span v-if="person._id === user.id" class="you-tag">YOU</span></strong><small>Workspace member</small></div></div>
            <select class="role-select" :value="person.role" :aria-label="`Role for ${person.username}`" @change="updateRole(person, $event)"><option value="admin">Admin</option><option value="editor">Editor</option><option value="viewer">Viewer</option></select>
            <time class="item-date" :datetime="person.createdAt">{{ new Date(person.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}</time>
            <span class="permission-summary">{{ person.role === 'admin' ? 'Manage all workspace data' : person.role === 'editor' ? 'Create and edit own items' : 'View shared items' }}</span>
          </article>
          <p class="people-note">Changes take effect immediately for the next API request.</p>
        </section>
      </div>
    </main>
  </div>
</template>
