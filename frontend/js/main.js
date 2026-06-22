// ─── CONFIG ─────────────────────────────────────────────────────────────────
const BASE = 'http://localhost:3000';
let TOKEN = localStorage.getItem('ims_token') || '';
let CURRENT_USER = JSON.parse(localStorage.getItem('ims_user') || 'null');

// ─── API ──────────────────────────────────────────────────────────────────────
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (TOKEN) opts.headers['Authorization'] = `Bearer ${TOKEN}`;
  if (body) opts.body = JSON.stringify(body);
  try {
    const r = await fetch(BASE + path, opts);
    if (r.status === 401) {
      logout();
      return null;
    }
    const text = await r.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (e) {
    toast('Network error — is the backend running?', 'error');
    return null;
  }
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}
document.querySelectorAll('.modal-overlay').forEach((o) => {
  o.addEventListener('click', (e) => {
    if (e.target === o) o.classList.remove('open');
  });
});

// ─── AUTH ─────────────────────────────────────────────────────────────────────
document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;
  if (!email || !pass) {
    toast('Please enter email and password', 'error');
    return;
  }
  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.textContent = 'Signing in…';
  const data = await api('POST', '/auth/login', {
    email,
    password: pass,
  });
  btn.disabled = false;
  btn.textContent = 'Sign In';
  if (!data || !data.access_token) {
    toast(data?.message || 'Login failed', 'error');
    return;
  }
  TOKEN = data.access_token;
  localStorage.setItem('ims_token', TOKEN);
  // Decode JWT to get user info
  try {
    const payload = JSON.parse(atob(TOKEN.split('.')[1]));
    CURRENT_USER = payload;
    localStorage.setItem('ims_user', JSON.stringify(payload));
  } catch (e) {
    CURRENT_USER = {};
  }
  toast('Welcome back!', 'success');
  initDashboard();
});

document.getElementById('loginPassword').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('loginBtn').click();
});

function logout() {
  TOKEN = '';
  CURRENT_USER = null;
  localStorage.removeItem('ims_token');
  localStorage.removeItem('ims_user');
  document.getElementById('app').style.display = 'none';
  document.getElementById('loginView').classList.add('show');
}
document.getElementById('logoutBtn').addEventListener('click', logout);

// ─── SIDEBAR & NAV ────────────────────────────────────────────────────────────
const NAV_CONFIG = {
  ADMIN: [
    {
      group: 'Overview',
      items: [
        {
          id: 'overview',
          label: 'Dashboard',
          icon: '🏠',
          view: 'view-overview',
          load: loadOverview,
        },
      ],
    },
    {
      group: 'Management',
      items: [
        {
          id: 'users',
          label: 'Users',
          icon: '👥',
          view: 'view-users',
          load: loadUsers,
        },
        {
          id: 'courses',
          label: 'Courses',
          icon: '📚',
          view: 'view-courses',
          load: loadCourses,
        },
        {
          id: 'enrollments',
          label: 'Enrollments',
          icon: '📝',
          view: 'view-enrollments',
          load: loadEnrollments,
        },
      ],
    },
    {
      group: 'Analytics',
      items: [
        {
          id: 'statistics',
          label: 'Statistics',
          icon: '📊',
          view: 'view-statistics',
          load: loadStatistics,
        },
      ],
    },
  ],
  TEACHER: [
    {
      group: 'Overview',
      items: [
        {
          id: 'overview',
          label: 'Dashboard',
          icon: '🏠',
          view: 'view-overview',
          load: loadOverview,
        },
      ],
    },
    {
      group: 'My Work',
      items: [
        {
          id: 'my-courses',
          label: 'My Courses',
          icon: '📚',
          view: 'view-my-courses',
          load: loadMyCourses,
        },
        {
          id: 'my-students',
          label: 'My Students',
          icon: '🎓',
          view: 'view-my-students',
          load: loadMyStudents,
        },
      ],
    },
  ],
  STUDENT: [
    {
      group: 'Overview',
      items: [
        {
          id: 'overview',
          label: 'Dashboard',
          icon: '🏠',
          view: 'view-overview',
          load: loadOverview,
        },
      ],
    },
    {
      group: 'Learning',
      items: [
        {
          id: 'my-enrollments',
          label: 'My Courses',
          icon: '📝',
          view: 'view-my-enrollments',
          load: loadMyEnrollments,
        },
      ],
    },
  ],
};

let activeNavId = null;

function buildSidebar(role) {
  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = '';
  const groups = NAV_CONFIG[role] || NAV_CONFIG.ADMIN;
  groups.forEach((g) => {
    const grp = document.createElement('div');
    grp.className = 'nav-group';
    grp.innerHTML = `<div class="nav-group-label">${g.group}</div>`;
    g.items.forEach((item) => {
      const el = document.createElement('div');
      el.className = 'nav-item';
      el.dataset.id = item.id;
      el.innerHTML = `<span class="ico">${item.icon}</span><span>${item.label}</span>`;
      el.addEventListener('click', () => navigateTo(item));
      grp.appendChild(el);
    });
    nav.appendChild(grp);
  });
}

function navigateTo(item) {
  // Hide all views
  document
    .querySelectorAll('.view')
    .forEach((v) => v.classList.remove('active'));
  document
    .querySelectorAll('.nav-item')
    .forEach((n) => n.classList.remove('active'));
  // Show target
  const view = document.getElementById(item.view);
  if (view) view.classList.add('active');
  const navEl = document.querySelector(`.nav-item[data-id="${item.id}"]`);
  if (navEl) navEl.classList.add('active');
  document.getElementById('pageTitle').textContent = item.label;
  activeNavId = item.id;
  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
  // Load data
  if (item.load) item.load();
}

// ─── HAMBURGER ────────────────────────────────────────────────────────────────
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('show');
});
document.getElementById('sidebarOverlay').addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
});

// ─── INIT DASHBOARD ───────────────────────────────────────────────────────────
function initDashboard() {
  document.getElementById('loginView').classList.remove('show');
  document.getElementById('app').style.display = 'flex';

  const role = (CURRENT_USER?.role || 'ADMIN').toUpperCase();
  const name = CURRENT_USER?.name || CURRENT_USER?.email || 'User';

  // Avatar
  const av = document.getElementById('sidebarAvatar');
  av.textContent = name.charAt(0).toUpperCase();
  av.className = `avatar ${role.toLowerCase()}`;
  document.getElementById('sidebarName').textContent = name;
  document.getElementById('sidebarRole').textContent = role;

  // Role badge
  const badge = document.getElementById('roleBadge');
  badge.textContent = role;
  badge.className = `topbar-badge badge-${role.toLowerCase()}`;

  buildSidebar(role);

  // Navigate to first item
  const groups = NAV_CONFIG[role] || NAV_CONFIG.ADMIN;
  if (groups.length && groups[0].items.length) {
    navigateTo(groups[0].items[0]);
  }
}

// Check existing session
if (TOKEN && CURRENT_USER) {
  initDashboard();
} else {
  document.getElementById('loginView').classList.add('show');
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
let _usersCache = [];
let _coursesCache = [];
let _enrollmentsCache = [];

function rolePill(role) {
  const map = {
    ADMIN: 'pill-blue',
    TEACHER: 'pill-teal',
    STUDENT: 'pill-amber',
  };
  return `<span class="pill ${map[role] || 'pill-blue'}">${role}</span>`;
}

function gradeBadge(grade, passing) {
  if (grade === null || grade === undefined)
    return `<div class="grade-badge grade-null">—</div>`;
  const pass = passing || 60;
  return `<div class="grade-badge ${grade >= pass ? 'grade-pass' : 'grade-fail'}">${grade}</div>`;
}

function statusPill(grade, passing) {
  if (grade === null || grade === undefined)
    return `<span class="pill pill-blue">Enrolled</span>`;
  return grade >= (passing || 60)
    ? `<span class="pill pill-green">Passed</span>`
    : `<span class="pill pill-rose">Failed</span>`;
}

function truncateId(id) {
  return id ? `<span class="mono">${String(id).slice(-8)}</span>` : '—';
}

function normalizeId(value) {
  if (value == null) return null;
  if (typeof value === 'object') {
    if (value._id != null) return normalizeId(value._id);
    if (value.id != null) return normalizeId(value.id);
    if (typeof value.toString === 'function') return value.toString();
    return null;
  }
  return String(value);
}

function nameFromId(id, list) {
  if (!id) return null;
  if (typeof id === 'object' && id.name) return id.name;
  const normalizedId = normalizeId(id);
  if (!normalizedId) return null;
  const u = list.find((x) => normalizeId(x._id || x.id) === normalizedId);
  return u ? u.name || u.course_name || '—' : truncateId(normalizedId);
}

function getTeacherName(course) {
  if (!course) return '—';
  if (course.teacher?.name) return course.teacher.name;
  if (course.teacher_id?.name) return course.teacher_id.name;
  if (course.teacher && typeof course.teacher === 'object') {
    return nameFromId(course.teacher, _usersCache) || '—';
  }
  return nameFromId(course.teacher_id || course.teacher, _usersCache) || '—';
}

// ─── LOAD: OVERVIEW ───────────────────────────────────────────────────────────
async function loadOverview() {
  const role = (CURRENT_USER?.role || 'ADMIN').toUpperCase();
  const [users, courses, enrollments] = await Promise.all([
    api('GET', '/users'),
    api('GET', '/courses'),
    role === 'STUDENT'
      ? api(
          'GET',
          `/enrollments/student/${normalizeId(CURRENT_USER?.sub || CURRENT_USER?._id || CURRENT_USER?.id)}`,
        )
      : api('GET', '/enrollments'),
  ]);
  _usersCache = users || [];
  _coursesCache = courses || [];
  _enrollmentsCache = enrollments || [];

  const teachers = _usersCache.filter((u) => u.role === 'TEACHER').length;
  const students = _usersCache.filter((u) => u.role === 'STUDENT').length;

  let statsHTML = '';
  if (role === 'ADMIN') {
    statsHTML = `
      <div class="stat-card blue"><div class="stat-label">Total Users</div><div class="stat-val blue">${_usersCache.length}</div><div class="stat-icon">👤</div></div>
      <div class="stat-card teal"><div class="stat-label">Teachers</div><div class="stat-val teal">${teachers}</div><div class="stat-icon">🏫</div></div>
      <div class="stat-card amber"><div class="stat-label">Students</div><div class="stat-val amber">${students}</div><div class="stat-icon">🎓</div></div>
      <div class="stat-card green"><div class="stat-label">Courses</div><div class="stat-val green">${_coursesCache.length}</div><div class="stat-icon">📚</div></div>
      <div class="stat-card rose"><div class="stat-label">Enrollments</div><div class="stat-val rose">${_enrollmentsCache.length}</div><div class="stat-icon">📝</div></div>
    `;
  } else if (role === 'TEACHER') {
    const myId = normalizeId(CURRENT_USER?.sub || CURRENT_USER?._id);
    const myCourses = _coursesCache.filter(
      (c) => normalizeId(c.teacher_id || c.teacher) === myId,
    );
    const courseIds = myCourses.map((c) => normalizeId(c));
    const myEnroll = _enrollmentsCache.filter((e) =>
      courseIds.includes(normalizeId(e.course_id || e.course)),
    );
    statsHTML = `
      <div class="stat-card blue"><div class="stat-label">My Courses</div><div class="stat-val blue">${myCourses.length}</div><div class="stat-icon">📚</div></div>
      <div class="stat-card teal"><div class="stat-label">My Students</div><div class="stat-val teal">${myEnroll.length}</div><div class="stat-icon">🎓</div></div>
      <div class="stat-card green"><div class="stat-label">Total Courses</div><div class="stat-val green">${_coursesCache.length}</div><div class="stat-icon">🏫</div></div>
    `;
  } else {
    const myEnroll = Array.isArray(_enrollmentsCache) ? _enrollmentsCache : [];
    const passed = myEnroll.filter(
      (e) => e.grade !== null && e.grade !== undefined && e.grade >= 60,
    ).length;
    statsHTML = `
      <div class="stat-card blue"><div class="stat-label">Enrolled In</div><div class="stat-val blue">${myEnroll.length}</div><div class="stat-icon">📝</div></div>
      <div class="stat-card green"><div class="stat-label">Passed</div><div class="stat-val green">${passed}</div><div class="stat-icon">✅</div></div>
      <div class="stat-card amber"><div class="stat-label">Available Courses</div><div class="stat-val amber">${_coursesCache.length}</div><div class="stat-icon">📚</div></div>
    `;
  }
  document.getElementById('overviewStats').innerHTML = statsHTML;

  // Recent courses
  const recentC = (_coursesCache || []).slice(0, 5);
  document.querySelector('#recentCoursesTable tbody').innerHTML = recentC.length
    ? recentC
        .map(
          (c) => `<tr>
        <td class="fw-600">${c.course_name || '—'}</td>
        <td>${getTeacherName(c)}</td>
        <td><span class="pill pill-green">${c.passing_grade ?? '—'}</span></td>
      </tr>`,
        )
        .join('')
    : '<tr><td colspan="3"><div class="empty-state"><div class="ico">📚</div><p>No courses yet</p></div></td></tr>';

  // Recent users (only visible to ADMIN)
  const recentUsersSection = document.getElementById('recentUsersSection');
  if (role === 'ADMIN') {
    if (recentUsersSection) recentUsersSection.style.display = '';
    const recentU = (_usersCache || []).slice(0, 5);
    const recentUsersHtml = recentU.length
      ? recentU
          .map(
            (u) => `<tr>
        <td class="fw-600">${u.name || '—'}</td>
        <td>${rolePill(u.role)}</td>
        <td class="text-muted text-sm">${u.email || '—'}</td>
      </tr>`,
          )
          .join('')
      : '<tr><td colspan="3"><div class="empty-state"><div class="ico">👥</div><p>No users yet</p></div></td></tr>';
    const recentUsersTbody = document.querySelector('#recentUsersTable tbody');
    if (recentUsersTbody) recentUsersTbody.innerHTML = recentUsersHtml;
  } else {
    if (recentUsersSection) recentUsersSection.style.display = 'none';
  }
}

// ─── LOAD: USERS ──────────────────────────────────────────────────────────────
let _userFilter = 'all';
async function loadUsers() {
  const data = await api('GET', '/users');
  _usersCache = data || [];
  renderUsersTable();
}

function filterUsers(f) {
  _userFilter = f;
  document.querySelectorAll('[data-tab]').forEach((t) => {
    const map = {
      'all-users': 'all',
      'teachers-tab': 'TEACHER',
      'students-tab': 'STUDENT',
    };
    t.classList.toggle('active', map[t.dataset.tab] === f);
  });
  renderUsersTable();
}

function renderUsersTable() {
  const list =
    _userFilter === 'all'
      ? _usersCache
      : _usersCache.filter((u) => u.role === _userFilter);
  const tbody = document.querySelector('#usersTable tbody');
  if (!list.length) {
    tbody.innerHTML =
      '<tr><td colspan="6"><div class="empty-state"><div class="ico">👥</div><p>No users found</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = list
    .map(
      (u) => `<tr>
    <td><div class="fw-600">${u.name || '—'}</div><div class="mono" style="font-size:.72rem;margin-top:2px;">${u._id || u.id || ''}</div></td>
    <td class="text-muted text-sm">${u.email || '—'}</td>
    <td>${rolePill(u.role)}</td>
    <td class="mono text-sm">${u.phone || '—'}</td>
    <td>${u.registration_year || '—'}</td>
    <td><div class="row-actions"></div></td>
  </tr>`,
    )
    .join('');
}

// ─── LOAD: COURSES ────────────────────────────────────────────────────────────
async function loadCourses() {
  const [courses, users] = await Promise.all([
    api('GET', '/courses'),
    api('GET', '/users'),
  ]);
  _coursesCache = courses || [];
  _usersCache = users || [];
  renderCoursesTable();
}

function renderCoursesTable() {
  const tbody = document.querySelector('#coursesTable tbody');
  if (!_coursesCache.length) {
    tbody.innerHTML =
      '<tr><td colspan="4"><div class="empty-state"><div class="ico">📚</div><p>No courses yet</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = _coursesCache
    .map((c) => {
      const tName = c.teacher?.name || nameFromId(c.teacher_id, _usersCache);
      return `<tr>
      <td><div class="fw-600">${c.course_name || '—'}</div><div class="mono" style="font-size:.72rem;margin-top:2px;">${c._id || ''}</div></td>
      <td>${tName}</td>
      <td><span class="pill pill-teal">${c.passing_grade ?? '—'}</span></td>
      <td><div class="row-actions">
        <button class="btn btn-ghost btn-sm" onclick="openEditCourse('${c._id || c.id}')">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteCourse('${c._id || c.id}')">🗑</button>
      </div></td>
    </tr>`;
    })
    .join('');
}

// ─── LOAD: ENROLLMENTS ────────────────────────────────────────────────────────
async function loadEnrollments() {
  const [enrollments, users, courses] = await Promise.all([
    api('GET', '/enrollments'),
    api('GET', '/users'),
    api('GET', '/courses'),
  ]);
  _enrollmentsCache = enrollments || [];
  _usersCache = users || [];
  _coursesCache = courses || [];
  renderEnrollmentsTable();
}

function renderEnrollmentsTable() {
  const tbody = document.querySelector('#enrollmentsTable tbody');
  if (!_enrollmentsCache.length) {
    tbody.innerHTML =
      '<tr><td colspan="5"><div class="empty-state"><div class="ico">📝</div><p>No enrollments yet</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = _enrollmentsCache
    .map((e) => {
      const sName = e.student?.name || nameFromId(e.student_id, _usersCache);
      const courseId = normalizeId(e.course_id || e.course);
      const course = _coursesCache.find(
        (c) => normalizeId(c._id || c.id) === courseId,
      );
      const cName =
        e.course?.course_name ||
        e.course?.name ||
        course?.course_name ||
        course?.name ||
        '—';
      const passing = course?.passing_grade || 60;
      return `<tr>
      <td class="fw-600">${sName}</td>
      <td>${cName}</td>
      <td>${gradeBadge(e.grade, passing)}</td>
      <td>${statusPill(e.grade, passing)}</td>
      <td><div class="row-actions">
        <button class="btn btn-danger btn-sm" onclick="deleteEnrollment('${e._id || e.id}')">🗑</button>
      </div></td>
    </tr>`;
    })
    .join('');
}

// ─── LOAD: STATISTICS ─────────────────────────────────────────────────────────
async function loadStatistics() {
  const [perCourse, perYear, successRate] = await Promise.all([
    api('GET', '/statistics/students-per-course'),
    api('GET', '/statistics/students-per-year'),
    api('GET', '/statistics/course-success-rate'),
  ]);

  // Totals
  const totalStudents = Array.isArray(perCourse)
    ? perCourse.reduce((a, c) => a + (c.count || c.studentCount || 0), 0)
    : 0;
  const avgSuccess = Array.isArray(successRate)
    ? Math.round(
        successRate.reduce((a, c) => a + (c.successRate || c.rate || 0), 0) /
          (successRate.length || 1),
      )
    : 0;

  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card blue"><div class="stat-label">Courses Tracked</div><div class="stat-val blue">${Array.isArray(perCourse) ? perCourse.length : 0}</div><div class="stat-icon">📚</div></div>
    <div class="stat-card teal"><div class="stat-label">Total Enrollments</div><div class="stat-val teal">${totalStudents}</div><div class="stat-icon">📝</div></div>
    <div class="stat-card green"><div class="stat-label">Avg. Success Rate</div><div class="stat-val green">${avgSuccess}%</div><div class="stat-icon">🏆</div></div>
  `;

  // Per course bars
  const maxCount = Array.isArray(perCourse)
    ? Math.max(...perCourse.map((c) => c.count || c.studentCount || 0), 1)
    : 1;
  document.getElementById('statsPerCourse').innerHTML =
    Array.isArray(perCourse) && perCourse.length
      ? perCourse
          .map((c) => {
            const count = c.count || c.studentCount || 0;
            return `<div style="margin-bottom:14px;">
          <div class="flex items-center gap-2" style="margin-bottom:6px;justify-content:space-between;">
            <span class="fw-600 text-sm">${c.course_name || c._id || '—'}</span>
            <span class="mono text-sm" style="color:var(--primary)">${count}</span>
          </div>
          <div class="prog-bar"><div class="prog-fill" style="width:${(count / maxCount) * 100}%;background:var(--primary)"></div></div>
        </div>`;
          })
          .join('')
      : '<div class="empty-state"><div class="ico">📊</div><p>No data available</p></div>';

  // Per year
  document.getElementById('statsPerYear').innerHTML =
    Array.isArray(perYear) && perYear.length
      ? `<div class="tbl-wrap"><table><thead><tr><th>Year</th><th>Students</th></tr></thead><tbody>${perYear.map((y) => `<tr><td class="fw-600">${y._id || y.year || '—'}</td><td><span class="pill pill-amber">${y.count || y.studentCount || 0}</span></td></tr>`).join('')}</tbody></table></div>`
      : '<div class="empty-state"><div class="ico">📅</div><p>No data available</p></div>';

  // Success rate
  document.getElementById('statsSuccess').innerHTML =
    Array.isArray(successRate) && successRate.length
      ? `<div class="tbl-wrap"><table><thead><tr><th>Course</th><th>Success Rate</th><th>Visual</th></tr></thead><tbody>${successRate
          .map((s) => {
            const rate = Math.round(s.successRate || s.rate || 0);
            const color =
              rate >= 70
                ? 'var(--green)'
                : rate >= 50
                  ? 'var(--amber)'
                  : 'var(--rose)';
            return `<tr>
          <td class="fw-600">${s.course_name || s._id || '—'}</td>
          <td><span style="color:${color};font-weight:700;font-family:var(--mono)">${rate}%</span></td>
          <td style="width:200px"><div class="prog-bar"><div class="prog-fill" style="width:${rate}%;background:${color}"></div></div></td>
        </tr>`;
          })
          .join('')}</tbody></table></div>`
      : '<div class="empty-state"><div class="ico">🏆</div><p>No data available</p></div>';
}

// ─── LOAD: MY COURSES (TEACHER) ───────────────────────────────────────────────
async function loadMyCourses() {
  const [courses, enrollments] = await Promise.all([
    api('GET', '/courses'),
    api('GET', '/enrollments'),
  ]);
  _coursesCache = courses || [];
  _enrollmentsCache = enrollments || [];
  const myId = normalizeId(
    CURRENT_USER?.sub || CURRENT_USER?._id || CURRENT_USER?.id,
  );
  const mine = _coursesCache.filter((c) => {
    const teacherId = normalizeId(c.teacher_id || c.teacher);
    return teacherId === myId;
  });
  const tbody = document.querySelector('#myCoursesTable tbody');
  tbody.innerHTML = mine.length
    ? mine
        .map((c) => {
          const courseId = normalizeId(c._id || c.id || c);
          const studentCount = _enrollmentsCache.filter(
            (e) => normalizeId(e.course_id || e.course) === courseId,
          ).length;
          return `<tr>
        <td><div class="fw-600">${c.course_name || '—'}</div><div class="mono" style="font-size:.72rem;">${c._id || ''}</div></td>
        <td><span class="pill pill-blue">${studentCount}</span></td>
        <td><span class="pill pill-teal">${c.passing_grade ?? '—'}</span></td>
      </tr>`;
        })
        .join('')
    : '<tr><td colspan="4"><div class="empty-state"><div class="ico">📚</div><p>No courses assigned</p></div></td></tr>';
}

// ─── LOAD: MY STUDENTS (TEACHER) ──────────────────────────────────────────────
async function loadMyStudents() {
  const [courses, enrollments, users] = await Promise.all([
    api('GET', '/courses'),
    api('GET', '/enrollments'),
    api('GET', '/users'),
  ]);
  _coursesCache = courses || [];
  _enrollmentsCache = enrollments || [];
  _usersCache = users || [];

  const myId = normalizeId(
    CURRENT_USER?.sub || CURRENT_USER?._id || CURRENT_USER?.id,
  );
  const myCourseIds = _coursesCache
    .filter((c) => normalizeId(c.teacher_id || c.teacher) === myId)
    .map((c) => normalizeId(c._id || c.id));

  const myEnrollments = _enrollmentsCache.filter((e) =>
    myCourseIds.includes(normalizeId(e.course_id || e.course)),
  );

  const tbody = document.querySelector('#myStudentsTable tbody');
  if (!myEnrollments.length) {
    tbody.innerHTML =
      '<tr><td colspan="5"><div class="empty-state"><div class="ico">🎓</div><p>No students enrolled in your courses</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = myEnrollments
    .map((e) => {
      const sName = e.student?.name || nameFromId(e.student_id, _usersCache);
      const courseId = normalizeId(e.course_id || e.course);
      const course = _coursesCache.find(
        (c) => normalizeId(c._id || c.id) === courseId,
      );
      const cName =
        e.course?.course_name ||
        e.course?.name ||
        course?.course_name ||
        course?.name ||
        '—';
      const passing = course?.passing_grade || 60;
      return `<tr>
      <td class="fw-600">${sName}</td>
      <td>${cName}</td>
      <td>${gradeBadge(e.grade, passing)}</td>
      <td>${statusPill(e.grade, passing)}</td>
      <td><button class="btn btn-teal btn-sm" onclick="openUpdateGrade('${e._id || e.id}')">🎯 Set Grade</button></td>
    </tr>`;
    })
    .join('');
}

// ─── LOAD: MY ENROLLMENTS (STUDENT) ───────────────────────────────────────────
async function loadMyEnrollments() {
  const myId = CURRENT_USER?.sub || CURRENT_USER?._id || CURRENT_USER?.id;
  if (!myId) {
    toast('Could not identify user', 'error');
    return;
  }

  const [enrollments, courses, users] = await Promise.all([
    api('GET', `/enrollments/student/${myId}`),
    api('GET', '/courses'),
    api('GET', '/users'),
  ]);
  _enrollmentsCache = enrollments || [];
  _coursesCache = courses || [];
  _usersCache = users || [];

  const tbody = document.querySelector('#myEnrollmentsTable tbody');
  if (!_enrollmentsCache.length) {
    tbody.innerHTML =
      '<tr><td colspan="4"><div class="empty-state"><div class="ico">📝</div><p>You are not enrolled in any courses yet</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = _enrollmentsCache
    .map((e) => {
      const courseRef = e.course_id || e.course;
      const normalizedCourseId = normalizeId(courseRef);
      const course =
        (courseRef && typeof courseRef === 'object' ? courseRef : null) ||
        _coursesCache.find((c) => normalizeId(c) === normalizedCourseId);
      const cName =
        course?.course_name ||
        course?.name ||
        (courseRef && courseRef.course_name) ||
        (courseRef && courseRef.name) ||
        '—';
      const tName =
        course?.teacher?.name ||
        course?.teacher_id?.name ||
        nameFromId(
          course?.teacher_id ||
            course?.teacher ||
            courseRef?.teacher_id ||
            courseRef?.teacher,
          _usersCache,
        ) ||
        '—';
      const passing = course?.passing_grade || 60;
      return `<tr>
      <td class="fw-600">${cName}</td>
      <td>${tName}</td>
      <td>${gradeBadge(e.grade, passing)}</td>
      <td>${statusPill(e.grade, passing)}</td>
    </tr>`;
    })
    .join('');
}

// ─── ACTIONS ──────────────────────────────────────────────────────────────────

// Create User
function toggleRoleFields() {}
async function createUser() {
  const body = {
    name: document.getElementById('cu-name').value.trim(),
    email: document.getElementById('cu-email').value.trim(),
    password: document.getElementById('cu-pass').value,
    role: document.getElementById('cu-role').value,
    phone: document.getElementById('cu-phone').value.trim(),
    registration_year:
      parseInt(document.getElementById('cu-year').value) || undefined,
    specialization:
      document.getElementById('cu-spec').value.trim() || undefined,
  };
  if (!body.name || !body.email || !body.password) {
    toast('Name, email and password required', 'error');
    return;
  }
  const res = await api('POST', '/users', body);
  if (res && (res._id || res.id || res.name)) {
    toast('User created successfully', 'success');
    closeModal('createUserModal');
    loadUsers();
  } else {
    toast(res?.message || 'Failed to create user', 'error');
  }
}

// Create Course
async function openCreateCourse() {
  const teachers = await api('GET', '/users/teachers');
  const sel = document.getElementById('cc-teacher');
  sel.innerHTML = '<option value="">— Select Teacher —</option>';
  (teachers || []).forEach(
    (t) =>
      (sel.innerHTML += `<option value="${t._id || t.id}">${t.name}</option>`),
  );
  openModal('createCourseModal');
}

async function createCourse() {
  const body = {
    course_name: document.getElementById('cc-name').value.trim(),
    teacher_id: document.getElementById('cc-teacher').value,
    passing_grade: parseInt(document.getElementById('cc-grade').value) || 60,
  };
  if (!body.course_name || !body.teacher_id) {
    toast('Course name and teacher required', 'error');
    return;
  }
  const res = await api('POST', '/courses', body);
  if (res && (res._id || res.id || res.course_name)) {
    toast('Course created', 'success');
    closeModal('createCourseModal');
    loadCourses();
  } else {
    toast(res?.message || 'Failed to create course', 'error');
  }
}

// Edit Course
async function openEditCourse(id) {
  const course =
    _coursesCache.find((c) => (c._id || c.id) === id) ||
    (await api('GET', `/courses/${id}`));
  if (!course) return;
  document.getElementById('ec-id').value = id;
  document.getElementById('ec-name').value = course.course_name || '';
  document.getElementById('ec-grade').value = course.passing_grade || '';
  openModal('editCourseModal');
}

async function updateCourse() {
  const id = document.getElementById('ec-id').value;
  const body = {
    course_name: document.getElementById('ec-name').value.trim() || undefined,
    passing_grade:
      parseInt(document.getElementById('ec-grade').value) || undefined,
  };
  const res = await api('PATCH', `/courses/${id}`, body);
  if (res && (res._id || res.id || res.course_name)) {
    toast('Course updated', 'success');
    closeModal('editCourseModal');
    const role = (CURRENT_USER?.role || '').toUpperCase();
    role === 'TEACHER' ? loadMyCourses() : loadCourses();
  } else {
    toast(res?.message || 'Failed to update', 'error');
  }
}

async function deleteCourse(id) {
  if (!confirm('Delete this course?')) return;
  const res = await api('DELETE', `/courses/${id}`);
  toast('Course deleted', 'success');
  loadCourses();
}

// Enrollments
async function openCreateEnroll() {
  const [students, courses] = await Promise.all([
    api('GET', '/users/students'),
    api('GET', '/courses'),
  ]);
  const ss = document.getElementById('en-student');
  const cs = document.getElementById('en-course');
  ss.innerHTML = '<option value="">— Select Student —</option>';
  cs.innerHTML = '<option value="">— Select Course —</option>';
  (students || []).forEach(
    (s) =>
      (ss.innerHTML += `<option value="${s._id || s.id}">${s.name}</option>`),
  );
  (courses || []).forEach(
    (c) =>
      (cs.innerHTML += `<option value="${c._id || c.id}">${c.course_name}</option>`),
  );
  openModal('createEnrollModal');
}

// Override the ＋ Enroll Student button to preload data
document.addEventListener('click', (e) => {
  if (e.target.closest('[onclick="openModal(\'createEnrollModal\')"]')) {
    e.preventDefault();
    e.stopPropagation();
    openCreateEnroll();
  }
  if (e.target.closest('[onclick="openModal(\'createCourseModal\')"]')) {
    e.preventDefault();
    e.stopPropagation();
    openCreateCourse();
  }
});

async function createEnrollment() {
  const body = {
    student_id: document.getElementById('en-student').value,
    course_id: document.getElementById('en-course').value,
  };
  if (!body.student_id || !body.course_id) {
    toast('Select student and course', 'error');
    return;
  }
  const res = await api('POST', '/enrollments', body);
  if (res && (res._id || res.id || res.student_id)) {
    toast('Enrolled successfully', 'success');
    closeModal('createEnrollModal');
    loadEnrollments();
  } else {
    toast(res?.message || 'Failed to enroll', 'error');
  }
}

function openUpdateGrade(id) {
  document.getElementById('ug-id').value = id;
  document.getElementById('ug-grade').value = '';
  openModal('updateGradeModal');
}

async function updateGrade() {
  const id = document.getElementById('ug-id').value;
  const grade = parseInt(document.getElementById('ug-grade').value);
  if (isNaN(grade) || grade < 0 || grade > 100) {
    toast('Enter a valid grade (0–100)', 'error');
    return;
  }
  const res = await api('PATCH', `/enrollments/${id}/grade`, { grade });
  if (res && (res._id || res.id || res.grade !== undefined)) {
    toast('Grade updated', 'success');
    closeModal('updateGradeModal');
    const role = (CURRENT_USER?.role || '').toUpperCase();
    role === 'TEACHER' ? loadMyStudents() : loadEnrollments();
  } else {
    toast(res?.message || 'Failed to update grade', 'error');
  }
}

async function deleteEnrollment(id) {
  if (!confirm('Remove this enrollment?')) return;
  await api('DELETE', `/enrollments/${id}`);
  toast('Enrollment removed', 'success');
  loadEnrollments();
}

// Student enroll
async function studentEnroll(courseId) {
  const myId = CURRENT_USER?.sub || CURRENT_USER?._id || CURRENT_USER?.id;
  if (!myId) {
    toast('Cannot identify user', 'error');
    return;
  }
  const res = await api('POST', '/enrollments', {
    student_id: myId,
    course_id: courseId,
  });
  if (res && (res._id || res.id || res.student_id)) {
    toast('Enrolled in course!', 'success');
    loadMyEnrollments();
  } else {
    toast(res?.message || 'Enrollment failed', 'error');
  }
}
