const API_BASE_URL = 'http://localhost:3000';

let currentUser = null;
let authToken = localStorage.getItem('authToken') || null;
let currentPage = 'dashboard';

// ============================================================
//  API HELPERS
// ============================================================
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
    ...options.headers,
  };
  const config = {
    ...options,
    headers,
  };
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'حدث خطأ في الطلب');
    }
    return data;
  } catch (error) {
    console.error('API Error:', error);
    showToast(error.message || 'فشل الاتصال بالخادم', 'error');
    throw error;
  }
}

// ============================================================
//  CHECK API STATUS
// ============================================================
async function checkApiStatus() {
  const dot = document.getElementById('apiDot');
  const text = document.getElementById('apiStatusText');
  try {
    const response = await fetch(`${API_BASE_URL}/courses`);
    if (response.ok) {
      dot.className = 'dot online';
      text.textContent = 'الخادم متصل';
    } else {
      dot.className = 'dot offline';
      text.textContent = 'الخادم غير متصل';
    }
  } catch (error) {
    dot.className = 'dot offline';
    text.textContent = 'الخادم غير متصل';
  }
}

// ============================================================
//  AUTH
// ============================================================
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const role = document.getElementById('loginRole').value;

  const loginBtn = document.getElementById('loginBtn');
  loginBtn.disabled = true;
  loginBtn.innerHTML = '<span class="loading-spinner"></span> جاري الدخول...';

  try {
    const result = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
    authToken = result.token;
    currentUser = result.user;
    localStorage.setItem('authToken', authToken);
    document.getElementById('loginError').classList.remove('show');
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('app').classList.add('active');
    initApp();
    checkApiStatus();
  } catch (err) {
    document.getElementById('loginError').classList.add('show');
    document.getElementById('loginError').textContent =
      err.message || 'بيانات الدخول غير صحيحة';
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> دخول';
  }
}

function logout() {
  currentUser = null;
  authToken = null;
  localStorage.removeItem('authToken');
  document.getElementById('app').classList.remove('active');
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('loginPassword').value = '';
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('active');
}

// ============================================================
//  NAVIGATION
// ============================================================
function navigate(page) {
  currentPage = page;
  renderPage();
  document.querySelectorAll('.sidebar-nav a').forEach((el) => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  const titles = {
    dashboard: 'لوحة التحكم',
    courses: 'إدارة الدورات',
    teachers: 'إدارة الأساتذة',
    students: 'إدارة الطلاب',
    enrollments: 'إدارة التسجيلات',
    statistics: 'الإحصائيات',
    my_courses: 'دروسي',
    grades: 'إدارة العلامات',
    available_courses: 'الدورات المتاحة',
    my_enrollments: 'تسجيلاتي وعلاماتي',
  };
  document.getElementById('pageTitle').textContent =
    titles[page] || 'لوحة التحكم';
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
  }
}

// ============================================================
//  RENDER ENGINE
// ============================================================
function renderPage() {
  const container = document.getElementById('pageContent');
  container.innerHTML =
    '<div class="text-center"><span class="loading-spinner" style="border-color:var(--primary);border-top-color:transparent;width:40px;height:40px;"></span><p class="mt-2">جاري التحميل...</p></div>';
  switch (currentPage) {
    case 'dashboard':
      renderDashboard(container);
      break;
    case 'courses':
      renderCourses(container);
      break;
    case 'teachers':
      renderTeachers(container);
      break;
    case 'students':
      renderStudents(container);
      break;
    case 'enrollments':
      renderEnrollments(container);
      break;
    case 'statistics':
      renderStatistics(container);
      break;
    case 'my_courses':
      renderTeacherCourses(container);
      break;
    case 'grades':
      renderGradeManagement(container);
      break;
    case 'available_courses':
      renderAvailableCourses(container);
      break;
    case 'my_enrollments':
      renderMyEnrollments(container);
      break;
    default:
      container.innerHTML = '<p>صفحة غير موجودة</p>';
  }
}

// ============================================================
//  SIDEBAR NAV BUILD
// ============================================================
function buildSidebar() {
  const nav = document.getElementById('sidebarNav');
  const role = currentUser.role;
  let items = [];

  if (role === 'admin') {
    items = [
      { page: 'dashboard', icon: 'fa-chart-pie', label: 'لوحة التحكم' },
      { page: 'courses', icon: 'fa-book', label: 'الدورات' },
      { page: 'teachers', icon: 'fa-chalkboard-teacher', label: 'الأساتذة' },
      { page: 'students', icon: 'fa-user-graduate', label: 'الطلاب' },
      { page: 'enrollments', icon: 'fa-user-plus', label: 'التسجيلات' },
      { page: 'statistics', icon: 'fa-chart-bar', label: 'الإحصائيات' },
    ];
  } else if (role === 'teacher') {
    items = [
      { page: 'my_courses', icon: 'fa-book-open', label: 'دروسي' },
      { page: 'grades', icon: 'fa-edit', label: 'إدارة العلامات' },
    ];
  } else if (role === 'student') {
    items = [
      { page: 'available_courses', icon: 'fa-list', label: 'الدورات المتاحة' },
      {
        page: 'my_enrollments',
        icon: 'fa-user-graduate',
        label: 'تسجيلاتي وعلاماتي',
      },
    ];
  }

  nav.innerHTML = items
    .map(
      (item) =>
        `<a href="#" data-page="${item.page}" onclick="navigate('${item.page}')">
            <i class="fas ${item.icon}"></i> ${item.label}
          </a>`,
    )
    .join('');

  const avatar = document.getElementById('sidebarAvatar');
  avatar.textContent = currentUser.name.charAt(0).toUpperCase();
  document.getElementById('sidebarName').textContent = currentUser.name;
  const roleNames = { admin: 'مدير', teacher: 'أستاذ', student: 'طالب' };
  document.getElementById('sidebarRole').textContent =
    roleNames[currentUser.role] || currentUser.role;
  document.getElementById('topbarRole').textContent =
    roleNames[currentUser.role] || currentUser.role;
}

// ============================================================
//  INIT APP
// ============================================================
function initApp() {
  buildSidebar();
  navigate('dashboard');
}

// ============================================================
//  TOAST
// ============================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    info: 'fa-info-circle',
    warning: 'fa-exclamation-triangle',
  };
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================================
//  MODAL
// ============================================================
function openModal(html) {
  document.getElementById('modalContent').innerHTML = html;
  document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
}
document.getElementById('modalOverlay').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});

// ============================================================
//  SIDEBAR TOGGLE
// ============================================================
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
}

// ============================================================
//  DASHBOARD (Admin)
// ============================================================
async function renderDashboard(container) {
  try {
    const [students, teachers, courses, enrollments] = await Promise.all([
      apiFetch('/users/students'),
      apiFetch('/users/teachers'),
      apiFetch('/courses'),
      apiFetch('/enrollments'),
    ]);

    const studentCount = students.length;
    const teacherCount = teachers.length;
    const courseCount = courses.length;
    const enrollmentCount = enrollments.length;

    let passed = 0;
    let total = 0;
    for (const e of enrollments) {
      if (e.grade !== null && e.grade !== undefined && e.grade !== '') {
        total++;
        const course = courses.find((c) => c.id === e.courseId);
        if (course && e.grade >= course.passingGrade) passed++;
      }
    }
    const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    container.innerHTML = `
          <div class="stats-grid">
            <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-book"></i></div>
              <div class="stat-info"><h3>${courseCount}</h3><p>الدورات</p></div></div>
            <div class="stat-card"><div class="stat-icon green"><i class="fas fa-user-graduate"></i></div>
              <div class="stat-info"><h3>${studentCount}</h3><p>الطلاب</p></div></div>
            <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-chalkboard-teacher"></i></div>
              <div class="stat-info"><h3>${teacherCount}</h3><p>الأساتذة</p></div></div>
            <div class="stat-card"><div class="stat-icon teal"><i class="fas fa-user-plus"></i></div>
              <div class="stat-info"><h3>${enrollmentCount}</h3><p>التسجيلات</p></div></div>
            <div class="stat-card"><div class="stat-icon red"><i class="fas fa-percent"></i></div>
              <div class="stat-info"><h3>${successRate}%</h3><p>نسبة النجاح الإجمالية</p></div></div>
          </div>
          <div class="card">
            <div class="card-header"><span class="card-title">آخر النشاطات</span></div>
            <p class="text-muted">مرحباً ${currentUser.name}! يمكنك إدارة جميع جوانب النظام من القائمة الجانبية.</p>
            <div style="margin-top:12px;display:flex;gap:12px;flex-wrap:wrap;">
              <button class="btn btn-primary btn-sm" onclick="navigate('courses')"><i class="fas fa-plus"></i> إدارة الدورات</button>
              <button class="btn btn-secondary btn-sm" onclick="navigate('students')"><i class="fas fa-user-plus"></i> إدارة الطلاب</button>
              <button class="btn btn-warning btn-sm" onclick="navigate('statistics')"><i class="fas fa-chart-bar"></i> عرض الإحصائيات</button>
            </div>
          </div>
        `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h4>فشل تحميل البيانات</h4><p>${err.message}</p></div>`;
  }
}

// ============================================================
//  COURSES (Admin)
// ============================================================
async function renderCourses(container) {
  try {
    const [courses, teachers] = await Promise.all([
      apiFetch('/courses'),
      apiFetch('/users/teachers'),
    ]);

    let rows = courses
      .map((c) => {
        const teacher = teachers.find((t) => t.id === c.teacherId);
        const tname = teacher ? teacher.name : 'غير معين';
        return `<tr>
            <td><strong>${c.title}</strong></td>
            <td>${c.description || '-'}</td>
            <td>${tname}</td>
            <td>${c.passingGrade}%</td>
            <td>
              <div class="actions-cell">
                <button class="btn btn-primary btn-xs" onclick="editCourse(${c.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-xs" onclick="deleteCourse(${c.id})"><i class="fas fa-trash"></i></button>
              </div>
            </td>
          </tr>`;
      })
      .join('');

    container.innerHTML = `
          <div class="toolbar">
            <button class="btn btn-primary" onclick="showAddCourse()"><i class="fas fa-plus"></i> دورة جديدة</button>
            <div class="search-box"><i class="fas fa-search"></i><input placeholder="بحث..." id="courseSearch" oninput="filterTable('courseSearch','courseTable')"/></div>
          </div>
          <div class="card">
            <div class="table-wrap">
              <table id="courseTable">
                <thead><tr><th>العنوان</th><th>الوصف</th><th>الأستاذ</th><th>علامة النجاح</th><th>الإجراءات</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="5" class="text-center text-muted">لا توجد دورات</td></tr>'}</tbody>
              </table>
            </div>
          </div>
        `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h4>فشل تحميل البيانات</h4><p>${err.message}</p></div>`;
  }
}

async function showAddCourse() {
  try {
    const teachers = await apiFetch('/users/teachers');
    const teacherOpts = teachers
      .map((t) => `<option value="${t.id}">${t.name}</option>`)
      .join('');
    openModal(`
          <div class="modal-header">
            <h3><i class="fas fa-plus-circle text-primary"></i> دورة جديدة</h3>
            <button class="close-modal" onclick="closeModal()">&times;</button>
          </div>
          <form onsubmit="saveCourse(event)">
            <div class="form-group"><label>عنوان الدورة</label><input type="text" id="f_course_title" required /></div>
            <div class="form-group"><label>الوصف</label><textarea id="f_course_desc"></textarea></div>
            <div class="form-group"><label>الأستاذ</label><select id="f_course_teacher">${teacherOpts}</select></div>
            <div class="form-group"><label>علامة النجاح (%)</label><input type="number" id="f_course_passing" value="60" min="0" max="100" required /></div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" onclick="closeModal()">إلغاء</button>
              <button type="submit" class="btn btn-primary">حفظ</button>
            </div>
          </form>
        `);
  } catch (err) {
    showToast('فشل تحميل قائمة الأساتذة', 'error');
  }
}

async function saveCourse(e) {
  e.preventDefault();
  const title = document.getElementById('f_course_title').value.trim();
  const description = document.getElementById('f_course_desc').value.trim();
  const teacherId = parseInt(document.getElementById('f_course_teacher').value);
  const passingGrade = parseInt(
    document.getElementById('f_course_passing').value,
  );

  try {
    await apiFetch('/courses', {
      method: 'POST',
      body: JSON.stringify({ title, description, teacherId, passingGrade }),
    });
    closeModal();
    showToast('تم إضافة الدورة بنجاح', 'success');
    renderPage();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function editCourse(id) {
  try {
    const course = await apiFetch(`/courses/${id}`);
    const teachers = await apiFetch('/users/teachers');
    const teacherOpts = teachers
      .map(
        (t) =>
          `<option value="${t.id}" ${t.id === course.teacherId ? 'selected' : ''}>${t.name}</option>`,
      )
      .join('');
    openModal(`
          <div class="modal-header">
            <h3><i class="fas fa-edit text-warning"></i> تعديل الدورة</h3>
            <button class="close-modal" onclick="closeModal()">&times;</button>
          </div>
          <form onsubmit="updateCourse(${id}, event)">
            <div class="form-group"><label>عنوان الدورة</label><input type="text" id="f_edit_course_title" value="${course.title}" required /></div>
            <div class="form-group"><label>الوصف</label><textarea id="f_edit_course_desc">${course.description || ''}</textarea></div>
            <div class="form-group"><label>الأستاذ</label><select id="f_edit_course_teacher">${teacherOpts}</select></div>
            <div class="form-group"><label>علامة النجاح (%)</label><input type="number" id="f_edit_course_passing" value="${course.passingGrade}" min="0" max="100" required /></div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" onclick="closeModal()">إلغاء</button>
              <button type="submit" class="btn btn-primary">تحديث</button>
            </div>
          </form>
        `);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function updateCourse(id, e) {
  e.preventDefault();
  const title = document.getElementById('f_edit_course_title').value.trim();
  const description = document
    .getElementById('f_edit_course_desc')
    .value.trim();
  const teacherId = parseInt(
    document.getElementById('f_edit_course_teacher').value,
  );
  const passingGrade = parseInt(
    document.getElementById('f_edit_course_passing').value,
  );

  try {
    await apiFetch(`/courses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title, description, teacherId, passingGrade }),
    });
    closeModal();
    showToast('تم تحديث الدورة', 'success');
    renderPage();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteCourse(id) {
  if (!confirm('هل أنت متأكد من حذف هذه الدورة؟')) return;
  try {
    await apiFetch(`/courses/${id}`, { method: 'DELETE' });
    showToast('تم حذف الدورة', 'info');
    renderPage();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================
//  TEACHERS (Admin)
// ============================================================
async function renderTeachers(container) {
  try {
    const teachers = await apiFetch('/users/teachers');
    let rows = teachers
      .map((t) => {
        return `<tr>
            <td><strong>${t.name}</strong></td>
            <td>${t.email}</td>
            <td>
              <div class="actions-cell">
                <button class="btn btn-primary btn-xs" onclick="editTeacher(${t.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-xs" onclick="deleteTeacher(${t.id})"><i class="fas fa-trash"></i></button>
              </div>
            </td>
          </tr>`;
      })
      .join('');

    container.innerHTML = `
          <div class="toolbar">
            <button class="btn btn-primary" onclick="showAddTeacher()"><i class="fas fa-plus"></i> أستاذ جديد</button>
            <div class="search-box"><i class="fas fa-search"></i><input placeholder="بحث..." id="teacherSearch" oninput="filterTable('teacherSearch','teacherTable')"/></div>
          </div>
          <div class="card">
            <div class="table-wrap">
              <table id="teacherTable">
                <thead><tr><th>الاسم</th><th>البريد الإلكتروني</th><th>الإجراءات</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="3" class="text-center text-muted">لا يوجد أساتذة</td></tr>'}</tbody>
              </table>
            </div>
          </div>
        `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h4>فشل تحميل البيانات</h4><p>${err.message}</p></div>`;
  }
}

function showAddTeacher() {
  openModal(`
        <div class="modal-header">
          <h3><i class="fas fa-user-plus text-primary"></i> أستاذ جديد</h3>
          <button class="close-modal" onclick="closeModal()">&times;</button>
        </div>
        <form onsubmit="saveTeacher(event)">
          <div class="form-group"><label>الاسم الكامل</label><input type="text" id="f_teacher_name" required /></div>
          <div class="form-group"><label>البريد الإلكتروني</label><input type="email" id="f_teacher_email" required /></div>
          <div class="form-group"><label>كلمة المرور</label><input type="password" id="f_teacher_password" required /></div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" onclick="closeModal()">إلغاء</button>
            <button type="submit" class="btn btn-primary">حفظ</button>
          </div>
        </form>
      `);
}

async function saveTeacher(e) {
  e.preventDefault();
  const name = document.getElementById('f_teacher_name').value.trim();
  const email = document.getElementById('f_teacher_email').value.trim();
  const password = document.getElementById('f_teacher_password').value.trim();

  try {
    await apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role: 'teacher' }),
    });
    closeModal();
    showToast('تم إضافة الأستاذ', 'success');
    renderPage();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function editTeacher(id) {
  try {
    const user = await apiFetch(`/users/${id}`);
    openModal(`
          <div class="modal-header">
            <h3><i class="fas fa-edit text-warning"></i> تعديل الأستاذ</h3>
            <button class="close-modal" onclick="closeModal()">&times;</button>
          </div>
          <form onsubmit="updateTeacher(${id}, event)">
            <div class="form-group"><label>الاسم الكامل</label><input type="text" id="f_edit_teacher_name" value="${user.name}" required /></div>
            <div class="form-group"><label>البريد الإلكتروني</label><input type="email" id="f_edit_teacher_email" value="${user.email}" required /></div>
            <div class="form-group"><label>كلمة المرور (اترك فارغاً للحفاظ على الحالية)</label><input type="password" id="f_edit_teacher_password" placeholder="••••••••" /></div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" onclick="closeModal()">إلغاء</button>
              <button type="submit" class="btn btn-primary">تحديث</button>
            </div>
          </form>
        `);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function updateTeacher(id, e) {
  e.preventDefault();
  const name = document.getElementById('f_edit_teacher_name').value.trim();
  const email = document.getElementById('f_edit_teacher_email').value.trim();
  const password = document
    .getElementById('f_edit_teacher_password')
    .value.trim();

  try {
    const payload = { name, email };
    if (password) payload.password = password;
    await apiFetch(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    closeModal();
    showToast('تم تحديث الأستاذ', 'success');
    renderPage();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteTeacher(id) {
  if (!confirm('هل أنت متأكد من حذف هذا الأستاذ؟')) return;
  try {
    await apiFetch(`/users/${id}`, { method: 'DELETE' });
    showToast('تم حذف الأستاذ', 'info');
    renderPage();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================
//  STUDENTS (Admin)
// ============================================================
async function renderStudents(container) {
  try {
    const students = await apiFetch('/users/students');
    let rows = students
      .map((s) => {
        return `<tr>
            <td><strong>${s.name}</strong></td>
            <td>${s.email}</td>
            <td>
              <div class="actions-cell">
                <button class="btn btn-primary btn-xs" onclick="editStudent(${s.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-xs" onclick="deleteStudent(${s.id})"><i class="fas fa-trash"></i></button>
              </div>
            </td>
          </tr>`;
      })
      .join('');

    container.innerHTML = `
          <div class="toolbar">
            <button class="btn btn-primary" onclick="showAddStudent()"><i class="fas fa-plus"></i> طالب جديد</button>
            <div class="search-box"><i class="fas fa-search"></i><input placeholder="بحث..." id="studentSearch" oninput="filterTable('studentSearch','studentTable')"/></div>
          </div>
          <div class="card">
            <div class="table-wrap">
              <table id="studentTable">
                <thead><tr><th>الاسم</th><th>البريد الإلكتروني</th><th>الإجراءات</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="3" class="text-center text-muted">لا يوجد طلاب</td></tr>'}</tbody>
              </table>
            </div>
          </div>
        `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h4>فشل تحميل البيانات</h4><p>${err.message}</p></div>`;
  }
}

function showAddStudent() {
  openModal(`
        <div class="modal-header">
          <h3><i class="fas fa-user-plus text-primary"></i> طالب جديد</h3>
          <button class="close-modal" onclick="closeModal()">&times;</button>
        </div>
        <form onsubmit="saveStudent(event)">
          <div class="form-group"><label>الاسم الكامل</label><input type="text" id="f_student_name" required /></div>
          <div class="form-group"><label>البريد الإلكتروني</label><input type="email" id="f_student_email" required /></div>
          <div class="form-group"><label>كلمة المرور</label><input type="password" id="f_student_password" required /></div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" onclick="closeModal()">إلغاء</button>
            <button type="submit" class="btn btn-primary">حفظ</button>
          </div>
        </form>
      `);
}

async function saveStudent(e) {
  e.preventDefault();
  const name = document.getElementById('f_student_name').value.trim();
  const email = document.getElementById('f_student_email').value.trim();
  const password = document.getElementById('f_student_password').value.trim();

  try {
    await apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role: 'student' }),
    });
    closeModal();
    showToast('تم إضافة الطالب', 'success');
    renderPage();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function editStudent(id) {
  try {
    const user = await apiFetch(`/users/${id}`);
    openModal(`
          <div class="modal-header">
            <h3><i class="fas fa-edit text-warning"></i> تعديل الطالب</h3>
            <button class="close-modal" onclick="closeModal()">&times;</button>
          </div>
          <form onsubmit="updateStudent(${id}, event)">
            <div class="form-group"><label>الاسم الكامل</label><input type="text" id="f_edit_student_name" value="${user.name}" required /></div>
            <div class="form-group"><label>البريد الإلكتروني</label><input type="email" id="f_edit_student_email" value="${user.email}" required /></div>
            <div class="form-group"><label>كلمة المرور (اترك فارغاً للحفاظ على الحالية)</label><input type="password" id="f_edit_student_password" placeholder="••••••••" /></div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" onclick="closeModal()">إلغاء</button>
              <button type="submit" class="btn btn-primary">تحديث</button>
            </div>
          </form>
        `);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function updateStudent(id, e) {
  e.preventDefault();
  const name = document.getElementById('f_edit_student_name').value.trim();
  const email = document.getElementById('f_edit_student_email').value.trim();
  const password = document
    .getElementById('f_edit_student_password')
    .value.trim();

  try {
    const payload = { name, email };
    if (password) payload.password = password;
    await apiFetch(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    closeModal();
    showToast('تم تحديث الطالب', 'success');
    renderPage();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteStudent(id) {
  if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
  try {
    await apiFetch(`/users/${id}`, { method: 'DELETE' });
    showToast('تم حذف الطالب', 'info');
    renderPage();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================
//  ENROLLMENTS (Admin)
// ============================================================
async function renderEnrollments(container) {
  try {
    const [enrollments, students, courses] = await Promise.all([
      apiFetch('/enrollments'),
      apiFetch('/users/students'),
      apiFetch('/courses'),
    ]);

    let rows = enrollments
      .map((e) => {
        const student = students.find((s) => s.id === e.studentId);
        const course = courses.find((c) => c.id === e.courseId);
        const sname = student ? student.name : 'غير معروف';
        const cname = course ? course.title : 'غير معروف';
        const grade =
          e.grade !== null && e.grade !== undefined && e.grade !== ''
            ? e.grade
            : '-';
        const isPass = course && grade !== '-' && grade >= course.passingGrade;
        const statusBadge =
          grade === '-'
            ? '<span class="badge-status pending">قيد الانتظار</span>'
            : isPass
              ? '<span class="badge-status pass">ناجح</span>'
              : '<span class="badge-status fail">راسب</span>';
        return `<tr>
            <td>${sname}</td>
            <td>${cname}</td>
            <td>${grade}</td>
            <td>${statusBadge}</td>
            <td>
              <div class="actions-cell">
                <button class="btn btn-warning btn-xs" onclick="editEnrollmentGrade(${e.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-xs" onclick="deleteEnrollment(${e.id})"><i class="fas fa-trash"></i></button>
              </div>
            </td>
          </tr>`;
      })
      .join('');

    container.innerHTML = `
          <div class="toolbar">
            <button class="btn btn-primary" onclick="showAddEnrollment()"><i class="fas fa-plus"></i> تسجيل جديد</button>
          </div>
          <div class="card">
            <div class="table-wrap">
              <table>
                <thead><tr><th>الطالب</th><th>الدورة</th><th>العلامة</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="5" class="text-center text-muted">لا توجد تسجيلات</td></tr>'}</tbody>
              </table>
            </div>
          </div>
        `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h4>فشل تحميل البيانات</h4><p>${err.message}</p></div>`;
  }
}

async function showAddEnrollment() {
  try {
    const [students, courses] = await Promise.all([
      apiFetch('/users/students'),
      apiFetch('/courses'),
    ]);
    const studentOpts = students
      .map((s) => `<option value="${s.id}">${s.name}</option>`)
      .join('');
    const courseOpts = courses
      .map((c) => `<option value="${c.id}">${c.title}</option>`)
      .join('');
    openModal(`
          <div class="modal-header">
            <h3><i class="fas fa-user-plus text-primary"></i> تسجيل جديد</h3>
            <button class="close-modal" onclick="closeModal()">&times;</button>
          </div>
          <form onsubmit="saveEnrollment(event)">
            <div class="form-group"><label>الطالب</label><select id="f_enroll_student">${studentOpts}</select></div>
            <div class="form-group"><label>الدورة</label><select id="f_enroll_course">${courseOpts}</select></div>
            <div class="form-group"><label>العلامة (اختياري)</label><input type="number" id="f_enroll_grade" min="0" max="100" placeholder="اترك فارغاً" /></div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" onclick="closeModal()">إلغاء</button>
              <button type="submit" class="btn btn-primary">حفظ</button>
            </div>
          </form>
        `);
  } catch (err) {
    showToast('فشل تحميل البيانات', 'error');
  }
}

async function saveEnrollment(e) {
  e.preventDefault();
  const studentId = parseInt(document.getElementById('f_enroll_student').value);
  const courseId = parseInt(document.getElementById('f_enroll_course').value);
  const gradeInput = document.getElementById('f_enroll_grade').value.trim();
  const grade = gradeInput !== '' ? parseFloat(gradeInput) : null;

  try {
    await apiFetch('/enrollments', {
      method: 'POST',
      body: JSON.stringify({ studentId, courseId, grade }),
    });
    closeModal();
    showToast('تم التسجيل بنجاح', 'success');
    renderPage();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function editEnrollmentGrade(id) {
  try {
    const all = await apiFetch('/enrollments');
    const e = all.find((en) => en.id === id);
    if (!e) throw new Error('التسجيل غير موجود');
    const student = await apiFetch(`/users/${e.studentId}`);
    const course = await apiFetch(`/courses/${e.courseId}`);
    openModal(`
          <div class="modal-header">
            <h3><i class="fas fa-edit text-warning"></i> تعديل العلامة</h3>
            <button class="close-modal" onclick="closeModal()">&times;</button>
          </div>
          <form onsubmit="updateEnrollmentGrade(${id}, event)">
            <p><strong>الطالب:</strong> ${student.name}</p>
            <p><strong>الدورة:</strong> ${course.title}</p>
            <div class="form-group"><label>العلامة</label><input type="number" id="f_edit_enroll_grade" value="${e.grade !== null && e.grade !== undefined && e.grade !== '' ? e.grade : ''}" min="0" max="100" /></div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" onclick="closeModal()">إلغاء</button>
              <button type="submit" class="btn btn-primary">تحديث</button>
            </div>
          </form>
        `);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function updateEnrollmentGrade(id, e) {
  e.preventDefault();
  const val = document.getElementById('f_edit_enroll_grade').value.trim();
  const grade = val !== '' ? parseFloat(val) : null;
  try {
    await apiFetch(`/enrollments/${id}/grade`, {
      method: 'PATCH',
      body: JSON.stringify({ grade }),
    });
    closeModal();
    showToast('تم تحديث العلامة', 'success');
    renderPage();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteEnrollment(id) {
  if (!confirm('هل أنت متأكد من حذف هذا التسجيل؟')) return;
  try {
    await apiFetch(`/enrollments/${id}`, { method: 'DELETE' });
    showToast('تم حذف التسجيل', 'info');
    renderPage();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================
//  STATISTICS (Admin)
// ============================================================
async function renderStatistics(container) {
  try {
    const [studentsPerCourse, courseSuccessRate, studentsPerYear] =
      await Promise.all([
        apiFetch('/statistics/students-per-course'),
        apiFetch('/statistics/course-success-rate'),
        apiFetch('/statistics/students-per-year'),
      ]);

    const maxCount = Math.max(...studentsPerCourse.map((s) => s.count), 1);
    const maxRate = Math.max(...courseSuccessRate.map((s) => s.successRate), 1);

    const barItems = studentsPerCourse
      .map(
        (s) =>
          `<div class="bar-item">
            <div class="bar-value">${s.count}</div>
            <div class="bar" style="height:${(s.count / maxCount) * 160}px;background:var(--primary-light);"></div>
            <div class="bar-label">${s.courseTitle ? s.courseTitle.slice(0, 10) + '…' : 'دورة'}</div>
          </div>`,
      )
      .join('');

    const rateItems = courseSuccessRate
      .map(
        (s) =>
          `<div class="bar-item">
            <div class="bar-value">${s.successRate}%</div>
            <div class="bar" style="height:${(s.successRate / 100) * 160}px;background:${s.successRate >= 60 ? 'var(--success)' : 'var(--danger)'};"></div>
            <div class="bar-label">${s.courseTitle ? s.courseTitle.slice(0, 10) + '…' : 'دورة'}</div>
          </div>`,
      )
      .join('');

    const yearItems = studentsPerYear
      .map(
        (s) =>
          `<div class="bar-item">
            <div class="bar-value">${s.count}</div>
            <div class="bar" style="height:${(s.count / Math.max(...studentsPerYear.map((y) => y.count), 1)) * 160}px;background:var(--secondary);"></div>
            <div class="bar-label">${s.year}</div>
          </div>`,
      )
      .join('');

    container.innerHTML = `
          <h3 class="mb-4">إحصائيات النظام</h3>

          <div class="chart-container">
            <h4><i class="fas fa-users text-primary"></i> عدد الطلاب المسجلين في كل دورة</h4>
            <div class="chart-bar">${barItems || '<p class="text-muted">لا توجد بيانات</p>'}</div>
          </div>

          <div class="chart-container">
            <h4><i class="fas fa-percent text-warning"></i> نسبة النجاح في كل دورة</h4>
            <div class="chart-bar">${rateItems || '<p class="text-muted">لا توجد بيانات</p>'}</div>
          </div>

          <div class="chart-container">
            <h4><i class="fas fa-calendar-alt text-secondary"></i> عدد الطلاب المسجلين سنوياً</h4>
            <div class="chart-bar">${yearItems || '<p class="text-muted">لا توجد بيانات</p>'}</div>
          </div>
        `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h4>فشل تحميل الإحصائيات</h4><p>${err.message}</p></div>`;
  }
}

// ============================================================
//  TEACHER: My Courses
// ============================================================
async function renderTeacherCourses(container) {
  try {
    const courses = await apiFetch('/courses');
    const teacherCourses = courses.filter(
      (c) => c.teacherId === currentUser.id,
    );
    const enrollments = await apiFetch('/enrollments');

    let rows = teacherCourses
      .map((c) => {
        const en = enrollments.filter((e) => e.courseId === c.id);
        const graded = en.filter(
          (e) => e.grade !== null && e.grade !== undefined && e.grade !== '',
        );
        const avg =
          graded.length > 0
            ? Math.round(
                graded.reduce((s, e) => s + e.grade, 0) / graded.length,
              )
            : 0;
        return `<tr>
            <td><strong>${c.title}</strong></td>
            <td>${c.description || '-'}</td>
            <td>${en.length}</td>
            <td>${graded.length}</td>
            <td>${avg > 0 ? avg + '%' : '-'}</td>
            <td><button class="btn btn-sm btn-secondary" onclick="navigate('grades')"><i class="fas fa-edit"></i> إدارة العلامات</button></td>
          </tr>`;
      })
      .join('');

    container.innerHTML = `
          <h3 class="mb-4">دروسي <span class="text-muted text-sm">(${teacherCourses.length} دورة)</span></h3>
          <div class="card">
            <div class="table-wrap">
              <table>
                <thead><tr><th>العنوان</th><th>الوصف</th><th>عدد الطلاب</th><th>مصنفين</th><th>المتوسط</th><th>الإجراءات</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="6" class="text-center text-muted">لا توجد دورات مخصصة لك</td></tr>'}</tbody>
              </table>
            </div>
          </div>
        `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h4>فشل تحميل البيانات</h4><p>${err.message}</p></div>`;
  }
}

// ============================================================
//  TEACHER: Grade Management
// ============================================================
async function renderGradeManagement(container) {
  try {
    const courses = await apiFetch('/courses');
    const teacherCourses = courses.filter(
      (c) => c.teacherId === currentUser.id,
    );
    if (teacherCourses.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-edit"></i><h4>لا توجد دورات</h4><p>لم يتم تخصيص أي دورة لك بعد</p></div>`;
      return;
    }

    const enrollments = await apiFetch('/enrollments');
    const students = await apiFetch('/users/students');

    let allEnrollments = [];
    teacherCourses.forEach((c) => {
      const en = enrollments.filter((e) => e.courseId === c.id);
      en.forEach((e) => {
        const student = students.find((s) => s.id === e.studentId);
        allEnrollments.push({
          ...e,
          courseTitle: c.title,
          studentName: student ? student.name : 'غير معروف',
          passingGrade: c.passingGrade,
        });
      });
    });

    let rows = allEnrollments
      .map((e) => {
        const isPass =
          e.grade !== null &&
          e.grade !== undefined &&
          e.grade !== '' &&
          e.grade >= e.passingGrade;
        const statusBadge =
          e.grade === null || e.grade === undefined || e.grade === ''
            ? '<span class="badge-status pending">قيد الانتظار</span>'
            : isPass
              ? '<span class="badge-status pass">ناجح</span>'
              : '<span class="badge-status fail">راسب</span>';
        return `<tr>
            <td>${e.studentName}</td>
            <td>${e.courseTitle}</td>
            <td>
              <input type="number" class="grade-input" id="grade_${e.id}" value="${e.grade !== null && e.grade !== undefined && e.grade !== '' ? e.grade : ''}" min="0" max="100" />
            </td>
            <td>${statusBadge}</td>
            <td>
              <button class="btn btn-success btn-xs" onclick="updateTeacherGrade(${e.id})"><i class="fas fa-save"></i> حفظ</button>
              <button class="btn btn-danger btn-xs" onclick="clearTeacherGrade(${e.id})"><i class="fas fa-undo"></i> مسح</button>
            </td>
          </tr>`;
      })
      .join('');

    container.innerHTML = `
          <h3 class="mb-4">إدارة العلامات</h3>
          <div class="card">
            <div class="table-wrap">
              <table>
                <thead><tr><th>الطالب</th><th>الدورة</th><th>العلامة</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="5" class="text-center text-muted">لا توجد تسجيلات في دوراتك</td></tr>'}</tbody>
              </table>
            </div>
          </div>
        `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h4>فشل تحميل البيانات</h4><p>${err.message}</p></div>`;
  }
}

async function updateTeacherGrade(enrollmentId) {
  const input = document.getElementById(`grade_${enrollmentId}`);
  if (!input) return;
  const val = input.value.trim();
  const grade = val !== '' ? parseFloat(val) : null;
  if (grade !== null && (grade < 0 || grade > 100)) {
    showToast('العلامة يجب أن تكون بين 0 و 100', 'error');
    return;
  }
  try {
    await apiFetch(`/enrollments/${enrollmentId}/grade`, {
      method: 'PATCH',
      body: JSON.stringify({ grade }),
    });
    showToast('تم تحديث العلامة', 'success');
    renderPage();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function clearTeacherGrade(enrollmentId) {
  if (!confirm('هل تريد مسح العلامة؟')) return;
  try {
    await apiFetch(`/enrollments/${enrollmentId}/grade`, {
      method: 'PATCH',
      body: JSON.stringify({ grade: null }),
    });
    showToast('تم مسح العلامة', 'info');
    renderPage();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================
//  STUDENT: Available Courses
// ============================================================
async function renderAvailableCourses(container) {
  try {
    const [courses, myEnrollments] = await Promise.all([
      apiFetch('/courses'),
      apiFetch(`/enrollments/student/${currentUser.id}`),
    ]);
    const teachers = await apiFetch('/users/teachers');

    const enrolledIds = myEnrollments.map((e) => e.courseId);

    let rows = courses
      .map((c) => {
        const teacher = teachers.find((t) => t.id === c.teacherId);
        const tname = teacher ? teacher.name : 'غير معين';
        const isEnrolled = enrolledIds.includes(c.id);
        return `<tr>
            <td><strong>${c.title}</strong></td>
            <td>${c.description || '-'}</td>
            <td>${tname}</td>
            <td>${c.passingGrade}%</td>
            <td>
              ${
                isEnrolled
                  ? '<span class="badge-status pass">مسجل</span>'
                  : `<button class="btn btn-success btn-xs" onclick="enrollStudent(${c.id})"><i class="fas fa-user-plus"></i> تسجيل</button>`
              }
            </td>
          </tr>`;
      })
      .join('');

    container.innerHTML = `
          <h3 class="mb-4">الدورات المتاحة</h3>
          <div class="card">
            <div class="table-wrap">
              <table>
                <thead><tr><th>العنوان</th><th>الوصف</th><th>الأستاذ</th><th>علامة النجاح</th><th>الإجراءات</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="5" class="text-center text-muted">لا توجد دورات متاحة</td></tr>'}</tbody>
              </table>
            </div>
          </div>
        `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h4>فشل تحميل البيانات</h4><p>${err.message}</p></div>`;
  }
}

async function enrollStudent(courseId) {
  try {
    await apiFetch('/enrollments', {
      method: 'POST',
      body: JSON.stringify({
        studentId: currentUser.id,
        courseId,
        grade: null,
      }),
    });
    showToast('تم التسجيل في الدورة', 'success');
    renderPage();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================
//  STUDENT: My Enrollments & Grades
// ============================================================
async function renderMyEnrollments(container) {
  try {
    const [enrollments, courses] = await Promise.all([
      apiFetch(`/enrollments/student/${currentUser.id}`),
      apiFetch('/courses'),
    ]);

    let rows = enrollments
      .map((e) => {
        const course = courses.find((c) => c.id === e.courseId);
        const cname = course ? course.title : 'غير معروف';
        const grade =
          e.grade !== null && e.grade !== undefined && e.grade !== ''
            ? e.grade
            : '-';
        const isPass = course && grade !== '-' && grade >= course.passingGrade;
        const statusBadge =
          grade === '-'
            ? '<span class="badge-status pending">قيد الانتظار</span>'
            : isPass
              ? '<span class="badge-status pass">ناجح</span>'
              : '<span class="badge-status fail">راسب</span>';
        return `<tr>
            <td>${cname}</td>
            <td>${grade}</td>
            <td>${statusBadge}</td>
            <td>${course ? course.passingGrade + '%' : '-'}</td>
          </tr>`;
      })
      .join('');

    container.innerHTML = `
          <h3 class="mb-4">تسجيلاتي وعلاماتي</h3>
          <div class="card">
            <div class="table-wrap">
              <table>
                <thead><tr><th>الدورة</th><th>العلامة</th><th>الحالة</th><th>علامة النجاح</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="4" class="text-center text-muted">لم تسجل في أي دورة بعد</td></tr>'}</tbody>
              </table>
            </div>
          </div>
        `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h4>فشل تحميل البيانات</h4><p>${err.message}</p></div>`;
  }
}

// ============================================================
//  UTILITY: Filter table
// ============================================================
function filterTable(searchId, tableId) {
  const input = document.getElementById(searchId);
  const filter = input.value.toLowerCase();
  const table = document.getElementById(tableId);
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach((row) => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(filter) ? '' : 'none';
  });
}

// ============================================================
//  KEYBOARD SHORTCUT: Escape to close modal
// ============================================================
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeModal();
});

// ============================================================
//  INIT
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
  // Check API status on load
  checkApiStatus();
  // Check if token exists for auto-login
  if (authToken) {
    // Attempt to verify token by fetching users
    apiFetch('/courses')
      .then(() => {
        // If successful, we need user data - but we don't have a /me endpoint
        // For now, we just show login page
        document.getElementById('loginPage').style.display = 'flex';
      })
      .catch(() => {
        localStorage.removeItem('authToken');
        authToken = null;
      });
  }
});
