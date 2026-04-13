// ============ MAIN APPLICATION ============

let globalData = {
  teachers: [],
  notices: [],
  gallery: [],
  ratings: [],
};

let homeContent = "";
let aboutContent = "";
let footerContent = "";
let isLoading = true;
let currentRoute = window.location.hash.slice(1) || "home";

// ============ JSONBIN.IO API FUNCTIONS ============

async function loadDataFromJSONBin() {
  try {
    const response = await fetch(
      `${CONFIG.BASE_URL}/b/${CONFIG.BIN_ID}/latest`,
      {
        headers: {
          "X-Master-Key": CONFIG.API_KEY,
        },
      },
    );

    if (response.ok) {
      const result = await response.json();
      const data = result.record;

      globalData.teachers = data.teachers || DEFAULT_DATA.teachers;
      globalData.notices = data.notices || DEFAULT_DATA.notices;
      globalData.gallery = data.gallery || DEFAULT_DATA.gallery;
      globalData.ratings = data.ratings || [];
      homeContent = data.homeContent || DEFAULT_DATA.homeContent;
      aboutContent = data.aboutContent || DEFAULT_DATA.aboutContent;
      footerContent = data.footerContent || DEFAULT_DATA.footerContent;

      console.log("Data loaded from JSONBin.io");
    } else {
      console.warn("Failed to fetch from JSONBin.io, using default data");
      useDefaultData();
    }
  } catch (error) {
    console.warn("JSONBin.io fetch error, using localStorage backup", error);
    loadLocalData();
  }

  finishLoading();
}

async function saveToJSONBin() {
  const dataToSave = {
    teachers: globalData.teachers,
    notices: globalData.notices,
    gallery: globalData.gallery,
    ratings: globalData.ratings,
    homeContent: homeContent,
    aboutContent: aboutContent,
    footerContent: footerContent,
    lastUpdated: new Date().toISOString(),
  };

  // Save to localStorage as backup
  saveLocalData(dataToSave);

  // Save to JSONBin.io
  try {
    const response = await fetch(`${CONFIG.BASE_URL}/b/${CONFIG.BIN_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": CONFIG.API_KEY,
      },
      body: JSON.stringify(dataToSave),
    });

    if (response.ok) {
      console.log("Data saved to JSONBin.io successfully");
    } else {
      console.warn("Failed to save to JSONBin.io");
    }
  } catch (error) {
    console.warn("JSONBin.io save error", error);
  }
}

// ============ DATA FUNCTIONS ============

function useDefaultData() {
  globalData.teachers = [...DEFAULT_DATA.teachers];
  globalData.notices = [...DEFAULT_DATA.notices];
  globalData.gallery = [...DEFAULT_DATA.gallery];
  globalData.ratings = [];
  homeContent = DEFAULT_DATA.homeContent;
  aboutContent = DEFAULT_DATA.aboutContent;
  footerContent = DEFAULT_DATA.footerContent;
}

function loadLocalData() {
  const stored = localStorage.getItem("rcs_album_data");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      globalData.teachers = parsed.teachers || DEFAULT_DATA.teachers;
      globalData.notices = parsed.notices || DEFAULT_DATA.notices;
      globalData.gallery = parsed.gallery || DEFAULT_DATA.gallery;
      globalData.ratings = parsed.ratings || [];
      homeContent = parsed.homeContent || DEFAULT_DATA.homeContent;
      aboutContent = parsed.aboutContent || DEFAULT_DATA.aboutContent;
      footerContent = parsed.footerContent || DEFAULT_DATA.footerContent;
    } catch (e) {
      useDefaultData();
    }
  } else {
    useDefaultData();
  }
}

function saveLocalData(dataToSave) {
  localStorage.setItem("rcs_album_data", JSON.stringify(dataToSave));
}

function finishLoading() {
  isLoading = false;
  render();

  const overlay = document.getElementById("loadingOverlay");
  if (overlay) {
    overlay.classList.add("hide");
    setTimeout(() => {
      overlay.style.display = "none";
    }, 500);
  }
}

let autoSaveTimer = null;
function autoSync() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(async () => {
    await saveToJSONBin();
  }, 2000);
}

// ============ UTILITY FUNCTIONS ============

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>]/g, (m) =>
    m === "&" ? "&amp;" : m === "<" ? "&lt;" : m === ">" ? "&gt;" : m,
  );
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  let toast = document.createElement("div");
  toast.className = "copy-toast";
  toast.innerHTML = `<i class="fas fa-check-circle"></i> ${text} copied!`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function showFullImage(url) {
  let modal = document.getElementById("imageModal");
  let modalImg = document.getElementById("modalImage");
  if (modal && modalImg) {
    modalImg.src = url;
    modal.classList.add("active");
  }
}

function closeModal() {
  document.getElementById("imageModal")?.classList.remove("active");
}

// ============ DATA MANIPULATION ============

function addTeacher(data) {
  globalData.teachers.unshift({ id: generateId(), ...data });
  render();
  autoSync();
}

function updateTeacher(id, data) {
  let idx = globalData.teachers.findIndex((t) => t.id === id);
  if (idx !== -1) {
    globalData.teachers[idx] = { ...globalData.teachers[idx], ...data };
    render();
    autoSync();
  }
}

function deleteTeacher(id) {
  globalData.teachers = globalData.teachers.filter((t) => t.id !== id);
  render();
  autoSync();
}

function addNotice(data) {
  globalData.notices.unshift({ id: generateId(), ...data });
  render();
  autoSync();
}

function updateNotice(id, data) {
  let idx = globalData.notices.findIndex((n) => n.id === id);
  if (idx !== -1) {
    globalData.notices[idx] = { ...globalData.notices[idx], ...data };
    render();
    autoSync();
  }
}

function deleteNotice(id) {
  globalData.notices = globalData.notices.filter((n) => n.id !== id);
  render();
  autoSync();
}

function addGalleryItem(data) {
  globalData.gallery.unshift({ id: generateId(), ...data });
  render();
  autoSync();
}

function updateGalleryItem(id, data) {
  let idx = globalData.gallery.findIndex((g) => g.id === id);
  if (idx !== -1) {
    globalData.gallery[idx] = { ...globalData.gallery[idx], ...data };
    render();
    autoSync();
  }
}

function deleteGalleryItem(id) {
  globalData.gallery = globalData.gallery.filter((g) => g.id !== id);
  render();
  autoSync();
}

function addRating(data) {
  globalData.ratings.unshift({
    id: generateId(),
    createdAt: new Date().toISOString(),
    ...data,
  });
  render();
  autoSync();
}

function deleteRating(id) {
  globalData.ratings = globalData.ratings.filter((r) => r.id !== id);
  render();
  autoSync();
}

function deleteAllRatings() {
  globalData.ratings = [];
  render();
  autoSync();
}

function setHomeContent(value) {
  homeContent = value;
  render();
  autoSync();
}

function setAboutContent(value) {
  aboutContent = value;
  render();
  autoSync();
}

function setFooterContent(value) {
  footerContent = value;
  render();
  autoSync();
}

// ============ SECURITY & AUTH ============

let adminLogged = false;
let sessionTimer = null;

function getLoginAttempts() {
  let a = localStorage.getItem("login_attempts");
  try {
    return a ? JSON.parse(a) : { count: 0, lockoutUntil: 0 };
  } catch (e) {
    return { count: 0, lockoutUntil: 0 };
  }
}

function saveLoginAttempts(a) {
  localStorage.setItem("login_attempts", JSON.stringify(a));
}

function isAccountLocked() {
  let a = getLoginAttempts();
  if (a.lockoutUntil > Date.now())
    return Math.ceil((a.lockoutUntil - Date.now()) / 60000);
  return false;
}

function recordFailedAttempt() {
  let a = getLoginAttempts();
  a.count++;
  if (a.count >= CONFIG.SECURITY.MAX_LOGIN_ATTEMPTS) {
    a.lockoutUntil = Date.now() + CONFIG.SECURITY.LOCKOUT_DURATION;
    a.count = 0;
  }
  saveLoginAttempts(a);
  return a;
}

function resetLoginAttempts() {
  saveLoginAttempts({ count: 0, lockoutUntil: 0 });
}

function getClientFingerprint() {
  return (
    navigator.userAgent +
    "|" +
    new Date().getTimezoneOffset() +
    "|" +
    (screen.width || "")
  );
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

function verifySession() {
  let s = localStorage.getItem("admin_session");
  if (!s) return false;
  try {
    let session = JSON.parse(s);
    let fp = localStorage.getItem("admin_fingerprint");
    if (session.expiresAt < Date.now()) return false;
    if (fp !== simpleHash(getClientFingerprint())) return false;
    return true;
  } catch (e) {
    return false;
  }
}

function createSession() {
  let session = {
    createdAt: Date.now(),
    expiresAt: Date.now() + CONFIG.SECURITY.SESSION_TIMEOUT,
  };
  localStorage.setItem("admin_session", JSON.stringify(session));
  localStorage.setItem("admin_fingerprint", simpleHash(getClientFingerprint()));
  localStorage.setItem("admin_auth", "true");
  return true;
}

function destroySession() {
  localStorage.removeItem("admin_session");
  localStorage.removeItem("admin_fingerprint");
  localStorage.removeItem("admin_auth");
}

function checkAndExtendSession() {
  let s = localStorage.getItem("admin_session");
  if (!s) return false;
  try {
    let session = JSON.parse(s);
    if (session.expiresAt < Date.now()) {
      destroySession();
      return false;
    }
    if (session.expiresAt - Date.now() > 5 * 60 * 1000) {
      session.expiresAt = Date.now() + CONFIG.SECURITY.SESSION_TIMEOUT;
      localStorage.setItem("admin_session", JSON.stringify(session));
    }
    return true;
  } catch (e) {
    return false;
  }
}

function checkAdminSession() {
  if (verifySession() && checkAndExtendSession()) {
    adminLogged = true;
    startSessionTimer();
    return true;
  } else {
    adminLogged = false;
    if (sessionTimer) clearInterval(sessionTimer);
    return false;
  }
}

function startSessionTimer() {
  if (sessionTimer) clearInterval(sessionTimer);
  sessionTimer = setInterval(() => {
    if (adminLogged && currentRoute === "admin") {
      if (!checkAndExtendSession()) {
        adminLogged = false;
        destroySession();
        alert("Session expired. Please login again.");
        navigate("home");
      }
    }
  }, 60000);
}

function adminLogin(email, pass) {
  let lockout = isAccountLocked();
  if (lockout)
    return { success: false, message: `Try again in ${lockout} minutes.` };

  if (
    email === CONFIG.SECURITY.VALID_EMAIL &&
    pass === CONFIG.SECURITY.VALID_PASSWORD
  ) {
    resetLoginAttempts();
    createSession();
    adminLogged = true;
    startSessionTimer();
    return { success: true };
  } else {
    let attempts = recordFailedAttempt();
    let remaining = CONFIG.SECURITY.MAX_LOGIN_ATTEMPTS - attempts.count;
    if (remaining <= 0)
      return { success: false, message: "Account locked for 15 minutes." };
    return {
      success: false,
      message: `Invalid credentials. ${remaining} attempts remaining.`,
    };
  }
}

function adminLogout() {
  destroySession();
  adminLogged = false;
  if (sessionTimer) clearInterval(sessionTimer);
  navigate("home");
  render();
}

// ============ NAVIGATION ============

function navigate(route) {
  currentRoute = route;
  window.location.hash = route;
  render();
}

window.addEventListener("hashchange", () => {
  currentRoute = window.location.hash.slice(1) || "home";
  render();
});

// ============ RENDER FUNCTIONS ============

function renderHome() {
  return `<div class="hero animate-up">
    <img class="hero-logo-img" src="logo.png" alt="RCS Logo">
    <div class="hero-logo">Album of RCS</div>
    <p class="hero-sub">${escapeHtml(homeContent)}</p>
    <div style="margin-top: 2rem;">
      <button class="btn" onclick="navigate('nostalgia')">Explore Memories <i class="fas fa-arrow-right"></i></button>
    </div>
  </div>`;
}

function renderAbout() {
  return `<div class="animate-slide" style="min-height: 400px;">
    <h1 style="color: var(--rcs-red); margin-bottom: 1rem;">About Rajshahi Collegiate School</h1>
    <div style="background: white; padding: 2rem; border-radius: 28px; line-height: 1.7;">${escapeHtml(aboutContent)}</div>
  </div>`;
}

function renderNostalgia() {
  return `<div class="animate-fade">
    <h1 style="margin-bottom: 1.5rem;">Nostalgia Gallery</h1>
    <div class="grid-gallery">
      ${globalData.gallery
        .map(
          (img) => `
        <div class="card">
          <img class="card-img" src="${img.url}" alt="${img.title}">
          <div class="caption"><strong>${escapeHtml(img.title)}</strong></div>
        </div>
      `,
        )
        .join("")}
    </div>
  </div>`;
}

function renderTeachers() {
  return `<div class="animate-up">
    <h1 style="margin-bottom: 0.5rem;">Mentors</h1>
    <p style="color: var(--rcs-gray-600); margin-bottom: 2rem;">${globalData.teachers.length} dedicated teachers</p>
    <div class="grid-gallery">
      ${globalData.teachers
        .map(
          (t) => `
        <div class="card">
          <img class="card-img" src="${t.photo}" alt="${t.name}" style="height: 260px; object-fit: cover;" onerror="this.src='https://randomuser.me/api/portraits/lego/1.jpg'">
          <div class="teacher-info">
            <h3>${escapeHtml(t.name)}</h3>
            <p><i class="fas fa-user-tie"></i> ${escapeHtml(t.designation)}</p>
            <p onclick="copyToClipboard('${t.phone}')" style="cursor: pointer;">
              <i class="fas fa-phone"></i> ${escapeHtml(t.phone || "N/A")} 
              <span style="font-size:10px;">(click to copy)</span>
            </p>
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
  </div>`;
}

function renderNotices() {
  return `<div class="animate-up">
    <h1 style="margin-bottom: 0.5rem;">Notice Board</h1>
    <p style="color: var(--rcs-gray-600); margin-bottom: 2rem;">Click on any notice to read full details</p>
    ${globalData.notices
      .map(
        (notice) => `
      <div class="notice-card" data-id="${notice.id}">
        <div class="notice-title">
          <span><i class="fas fa-bullhorn" style="color:var(--rcs-red); margin-right:8px;"></i>${escapeHtml(notice.title)}</span>
          <span class="notice-badge"><i class="far fa-calendar-alt"></i> ${notice.date}</span>
        </div>
        <div class="notice-detail" id="detail-${notice.id}">
          <p>${escapeHtml(notice.description)}</p>
          ${
            notice.image
              ? `
            <img src="${notice.image}" class="notice-img" onclick="event.stopPropagation(); showFullImage('${notice.image}')" alt="Notice Image">
            <div class="click-hint"><i class="fas fa-hand-point-right"></i> Click here to see more</div>
          `
              : ""
          }
        </div>
      </div>
    `,
      )
      .join("")}
  </div>`;
}

function renderRatings() {
  return `<div class="animate-up">
    <h1>Community Voices</h1>
    <p style="color: var(--rcs-gray-600); margin-bottom: 1.5rem;">Share your journey and read memories</p>
    <div style="background: var(--rcs-gray-50); border-radius: 28px; padding: 2rem; margin: 1.5rem auto; max-width: 800px;">
      <h3>Leave a Memory</h3>
      <form id="reviewForm">
        <input type="text" id="revName" placeholder="Full name" required>
        <input type="text" id="revSchool" placeholder="School" required>
        <input type="text" id="revBatch" placeholder="SSC Batch">
        <input type="email" id="revEmail" placeholder="Email">
        <textarea rows="3" id="revReview" placeholder="Write your nostalgic memory..." required></textarea>
        <button type="submit" class="btn">Share Memory <i class="fas fa-paper-plane"></i></button>
      </form>
    </div>
    <h2>Recent Reflections</h2>
    ${
      globalData.ratings
        .map(
          (r) => `
      <div class="rating-card">
        <div><strong>${escapeHtml(r.name)}</strong> • Batch ${escapeHtml(r.batch || "—")} • ${escapeHtml(r.school)}</div>
        <p>${escapeHtml(r.review)}</p>
        <small>${new Date(r.createdAt).toLocaleDateString()}</small>
      </div>
    `,
        )
        .join("") ||
      '<div style="text-align:center; padding:2rem;">Be the first to share.</div>'
    }
  </div>`;
}

function renderAdmin() {
  if (!adminLogged) {
    let lockout = isAccountLocked();
    return `<div class="animate-up">
      <div class="login-card">
        <h2><i class="fas fa-shield-alt" style="color:var(--rcs-red);"></i> Admin Login</h2>
        <form id="adminLoginForm">
          <input type="email" id="adminEmail" placeholder="Email address" required>
          <input type="password" id="adminPass" placeholder="Password" required>
          <button type="submit" class="btn" style="width:100%;" ${lockout ? "disabled" : ""}>Login <i class="fas fa-arrow-right"></i></button>
        </form>
        <div id="loginError" class="error-message"></div>
      </div>
    </div>`;
  }

  return `<div class="admin-container animate-fade">
    <div class="admin-header">
      <h1><i class="fas fa-shield-alt" style="margin-right:10px;"></i>Admin Dashboard</h1>
      <button class="admin-logout" id="logoutAdminBtn"><i class="fas fa-sign-out-alt"></i> Logout</button>
    </div>
    <div class="admin-tabs">
      <button class="admin-tab active" data-tab="home-tab">Home & About</button>
      <button class="admin-tab" data-tab="teachers-tab">Teachers (${globalData.teachers.length})</button>
      <button class="admin-tab" data-tab="notices-tab">Notices (${globalData.notices.length})</button>
      <button class="admin-tab" data-tab="gallery-tab">Gallery (${globalData.gallery.length})</button>
      <button class="admin-tab" data-tab="ratings-tab">Ratings (${globalData.ratings.length})</button>
      <button class="admin-tab" data-tab="footer-tab">Footer</button>
    </div>
    
    <div id="home-tab" class="admin-section active">
      <div class="admin-card">
        <h3>Homepage Content</h3>
        <textarea id="homeEditArea" rows="3" style="width:100%; border-radius:20px;">${escapeHtml(homeContent)}</textarea>
        <button id="saveHomeBtn" class="btn" style="margin-top:1rem;">Update Home</button>
      </div>
      <div class="admin-card">
        <h3>About RCS Content</h3>
        <textarea id="aboutEditArea" rows="5" style="width:100%; border-radius:20px;">${escapeHtml(aboutContent)}</textarea>
        <button id="saveAboutBtn" class="btn">Update About</button>
      </div>
    </div>
    
    <div id="teachers-tab" class="admin-section">
      <div class="admin-card">
        <h3>Add New Teacher</h3>
        <button id="showAddTeacherForm" class="btn btn-sm" style="margin-bottom:1rem;">+ Show Form</button>
        <div id="addTeacherForm" class="edit-form">
          <input type="text" id="teacherName" placeholder="Name">
          <input type="text" id="teacherDesignation" placeholder="Designation">
          <input type="text" id="teacherPhone" placeholder="Phone">
          <input type="text" id="teacherPhotoUrl" placeholder="Image URL">
          <input type="file" id="teacherPhotoUpload" accept="image/*">
          <button id="addTeacherBtn" class="btn">Save Teacher</button>
        </div>
      </div>
      <div class="admin-card">
        <h3>Current Teachers (${globalData.teachers.length})</h3>
        <div id="teacherList">
          ${globalData.teachers
            .map(
              (t) => `
            <div class="item-card">
              <div><strong>${escapeHtml(t.name)}</strong><br><small>${escapeHtml(t.designation)}</small></div>
              <div>
                <button class="edit-btn" onclick="editTeacher('${t.id}')">Edit</button>
                <button class="delete-btn" onclick="deleteTeacherItem('${t.id}')">Delete</button>
              </div>
            </div>
            <div id="edit-form-${t.id}" class="edit-form">
              <h4>Edit ${escapeHtml(t.name)}</h4>
              <input type="text" id="edit-name-${t.id}" value="${escapeHtml(t.name)}">
              <input type="text" id="edit-designation-${t.id}" value="${escapeHtml(t.designation)}">
              <input type="text" id="edit-phone-${t.id}" value="${escapeHtml(t.phone || "")}">
              <input type="text" id="edit-photo-url-${t.id}" value="${escapeHtml(t.photo || "")}" placeholder="Image URL">
              <input type="file" id="edit-photo-file-${t.id}" accept="image/*">
              <button class="btn" onclick="updateTeacherItem('${t.id}')">Update</button>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    </div>
    
    <div id="notices-tab" class="admin-section">
      <div class="admin-card">
        <h3>Add New Notice</h3>
        <button id="showAddNoticeForm" class="btn btn-sm" style="margin-bottom:1rem;">+ Show Form</button>
        <div id="addNoticeForm" class="edit-form">
          <input type="text" id="noticeTitle" placeholder="Title">
          <textarea id="noticeDesc" rows="2" placeholder="Description"></textarea>
          <input type="file" id="noticeImage" accept="image/*">
          <input type="date" id="noticeDate">
          <button id="addNoticeBtn" class="btn">Save Notice</button>
        </div>
      </div>
      <div class="admin-card">
        <h3>Current Notices</h3>
        <div id="noticeList">
          ${globalData.notices
            .map(
              (n) => `
            <div class="item-card">
              <div><strong>${escapeHtml(n.title)}</strong><br><small>${n.date}</small></div>
              <div>
                <button class="edit-btn" onclick="editNotice('${n.id}')">Edit</button>
                <button class="delete-btn" onclick="deleteNoticeItem('${n.id}')">Delete</button>
              </div>
            </div>
            <div id="edit-notice-form-${n.id}" class="edit-form">
              <h4>Edit Notice</h4>
              <input type="text" id="edit-notice-title-${n.id}" value="${escapeHtml(n.title)}">
              <textarea id="edit-notice-desc-${n.id}" rows="2">${escapeHtml(n.description)}</textarea>
              <input type="file" id="edit-notice-image-${n.id}" accept="image/*">
              <input type="date" id="edit-notice-date-${n.id}" value="${n.date}">
              <button class="btn" onclick="updateNoticeItem('${n.id}')">Update</button>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    </div>
    
    <div id="gallery-tab" class="admin-section">
      <div class="admin-card">
        <h3>Add New Image</h3>
        <button id="showAddImageForm" class="btn btn-sm" style="margin-bottom:1rem;">+ Show Form</button>
        <div id="addImageForm" class="edit-form">
          <input type="file" id="galleryFileUpload" accept="image/*">
          <input type="text" id="galleryTitle" placeholder="Image Title">
          <button id="addGalleryBtn" class="btn">Upload</button>
        </div>
      </div>
      <div class="admin-card">
        <h3>Gallery Items</h3>
        <div id="galleryList">
          ${globalData.gallery
            .map(
              (img) => `
            <div class="item-card">
              <div>
                <img src="${img.url}" style="width:40px;height:40px;object-fit:cover;border-radius:8px;"> 
                <strong>${escapeHtml(img.title)}</strong>
              </div>
              <div>
                <button class="edit-btn" onclick="editGallery('${img.id}')">Edit</button>
                <button class="delete-btn" onclick="deleteGalleryItemConfirm('${img.id}')">Delete</button>
              </div>
            </div>
            <div id="edit-gallery-form-${img.id}" class="edit-form">
              <input type="text" id="edit-gallery-title-${img.id}" value="${escapeHtml(img.title)}">
              <button class="btn" onclick="updateGalleryItem('${img.id}')">Update Title</button>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    </div>
    
    <div id="ratings-tab" class="admin-section">
      <div class="admin-card">
        <h3>Manage User Ratings (${globalData.ratings.length})</h3>
        <div id="ratingsList">
          ${
            globalData.ratings
              .map(
                (r) => `
            <div class="item-card">
              <div>
                <strong>${escapeHtml(r.name)}</strong>: ${escapeHtml(r.review.substring(0, 50))}${r.review.length > 50 ? "..." : ""}
              </div>
              <button class="delete-btn" onclick="deleteRatingItem('${r.id}')">Delete</button>
            </div>
          `,
              )
              .join("") || "<p>No ratings yet.</p>"
          }
        </div>
        <button id="deleteAllRatingsBtn" class="btn" style="background:#b91c1c; margin-top:1rem;">Delete All Ratings</button>
      </div>
    </div>
    
    <div id="footer-tab" class="admin-section">
      <div class="admin-card">
        <h3>Footer Text</h3>
        <textarea id="footerEdit" rows="3" style="width:100%; border-radius:20px;">${escapeHtml(footerContent)}</textarea>
        <button id="saveFooterBtn" class="btn" style="margin-top:1rem;">Update Footer</button>
      </div>
    </div>
  </div>`;
}

function renderFooter() {
  return `<footer class="premium-footer">
    <div class="footer-content">
      <div class="footer-brand">
        <h3>Album of RCS</h3>
        <p>${escapeHtml(footerContent)}</p>
      </div>
      <div class="footer-social">
        <a href="mailto:albumofrcs@gmail.com" target="_blank"><i class="fas fa-envelope"></i></a>
        <a href="https://instagram.com/albumofrcs" target="_blank"><i class="fab fa-instagram"></i></a>
        <a href="https://facebook.com/albumofrcs" target="_blank"><i class="fab fa-facebook-f"></i></a>
      </div>
    </div>
    <div class="footer-bottom">
      <p>Website by <a href="https://instagram.com/tamimiq_" target="_blank">Tamim Iqbal</a></p>
    </div>
  </footer>`;
}

// ============ ADMIN EDIT FUNCTIONS ============

window.editTeacher = (id) => {
  document.getElementById(`edit-form-${id}`)?.classList.toggle("show");
};

window.updateTeacherItem = async (id) => {
  let name = document.getElementById(`edit-name-${id}`).value;
  let des = document.getElementById(`edit-designation-${id}`).value;
  let phone = document.getElementById(`edit-phone-${id}`).value;
  let url = document.getElementById(`edit-photo-url-${id}`).value;
  let file = document.getElementById(`edit-photo-file-${id}`).files[0];
  let photo = url;
  if (file) photo = await fileToBase64(file);
  updateTeacher(id, { name, designation: des, phone, photo });
};

window.deleteTeacherItem = (id) => {
  if (confirm("Delete this teacher?")) deleteTeacher(id);
};

window.editNotice = (id) => {
  document.getElementById(`edit-notice-form-${id}`)?.classList.toggle("show");
};

window.updateNoticeItem = async (id) => {
  let title = document.getElementById(`edit-notice-title-${id}`).value;
  let desc = document.getElementById(`edit-notice-desc-${id}`).value;
  let date = document.getElementById(`edit-notice-date-${id}`).value;
  let file = document.getElementById(`edit-notice-image-${id}`).files[0];
  let image = "";
  if (file) image = await fileToBase64(file);
  updateNotice(id, { title, description: desc, date, image });
};

window.deleteNoticeItem = (id) => {
  if (confirm("Delete this notice?")) deleteNotice(id);
};

window.editGallery = (id) => {
  document.getElementById(`edit-gallery-form-${id}`)?.classList.toggle("show");
};

window.updateGalleryItem = async (id) => {
  let title = document.getElementById(`edit-gallery-title-${id}`).value;
  updateGalleryItem(id, { title });
};

window.deleteGalleryItemConfirm = (id) => {
  if (confirm("Delete this image?")) deleteGalleryItem(id);
};

window.deleteRatingItem = (id) => {
  if (confirm("Delete this rating?")) deleteRating(id);
};

// ============ RENDER & EVENT HANDLERS ============

function render() {
  if (isLoading) return;

  let mainContent = "";
  if (currentRoute === "home") mainContent = renderHome();
  else if (currentRoute === "about") mainContent = renderAbout();
  else if (currentRoute === "nostalgia") mainContent = renderNostalgia();
  else if (currentRoute === "teachers") mainContent = renderTeachers();
  else if (currentRoute === "notices") mainContent = renderNotices();
  else if (currentRoute === "ratings") mainContent = renderRatings();
  else if (currentRoute === "admin") mainContent = renderAdmin();
  else mainContent = renderHome();

  const fullHTML = `
    <nav class="navbar">
      <div class="nav-container">
        <div class="logo"><h2>Album of RCS</h2></div>
        <div class="menu-icon" id="menuToggle"><i class="fas fa-bars"></i></div>
        <ul class="nav-links" id="navLinks">
          <li><a href="#" onclick="navigate('home');return false;">Home</a></li>
          <li><a href="#" onclick="navigate('about');return false;">About</a></li>
          <li><a href="#" onclick="navigate('nostalgia');return false;">Nostalgia</a></li>
          <li><a href="#" onclick="navigate('teachers');return false;">Teachers</a></li>
          <li><a href="#" onclick="navigate('notices');return false;">Notices</a></li>
          <li><a href="#" onclick="navigate('ratings');return false;">Ratings</a></li>
        </ul>
      </div>
    </nav>
    <div class="container main-content">${mainContent}</div>
    ${renderFooter()}
    <div id="imageModal" class="image-modal" onclick="closeModal()">
      <span class="close-modal">&times;</span>
      <img id="modalImage" class="modal-img" src="">
    </div>
  `;

  document.getElementById("app").innerHTML = fullHTML;
  attachGlobalHandlers();
  attachAdminHandlers();
  attachNoticeToggle();
  toggleMobileMenu();
}

function attachNoticeToggle() {
  document.querySelectorAll(".notice-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("notice-img")) return;
      let detail = card.querySelector(".notice-detail");
      if (detail) detail.classList.toggle("show");
    });
  });
}

function attachGlobalHandlers() {
  let rf = document.getElementById("reviewForm");
  if (rf) {
    rf.onsubmit = (e) => {
      e.preventDefault();
      let name = document.getElementById("revName").value;
      let school = document.getElementById("revSchool").value;
      let batch = document.getElementById("revBatch").value;
      let email = document.getElementById("revEmail").value;
      let review = document.getElementById("revReview").value;
      if (!name || !review) return alert("Name and review required.");
      addRating({ name, school, batch, email, review });
      rf.reset();
    };
  }

  let alf = document.getElementById("adminLoginForm");
  if (alf) {
    alf.onsubmit = (e) => {
      e.preventDefault();
      let email = document.getElementById("adminEmail").value;
      let pass = document.getElementById("adminPass").value;
      let result = adminLogin(email, pass);
      if (result.success) render();
      else document.getElementById("loginError").textContent = result.message;
    };
  }

  let lob = document.getElementById("logoutAdminBtn");
  if (lob) lob.onclick = () => adminLogout();
}

function attachAdminHandlers() {
  if (!adminLogged) return;

  document.querySelectorAll(".admin-tab").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      document
        .querySelectorAll(".admin-tab")
        .forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      document
        .querySelectorAll(".admin-section")
        .forEach((s) => s.classList.remove("active"));
      document.getElementById(tab.dataset.tab).classList.add("active");
    });
  });

  document.getElementById("saveHomeBtn")?.addEventListener("click", () => {
    setHomeContent(document.getElementById("homeEditArea").value);
  });

  document.getElementById("saveAboutBtn")?.addEventListener("click", () => {
    setAboutContent(document.getElementById("aboutEditArea").value);
  });

  document.getElementById("saveFooterBtn")?.addEventListener("click", () => {
    setFooterContent(document.getElementById("footerEdit").value);
  });

  document
    .getElementById("showAddTeacherForm")
    ?.addEventListener("click", () => {
      document.getElementById("addTeacherForm").classList.toggle("show");
    });

  document
    .getElementById("addTeacherBtn")
    ?.addEventListener("click", async () => {
      let name = document.getElementById("teacherName").value;
      let des = document.getElementById("teacherDesignation").value;
      let phone = document.getElementById("teacherPhone").value;
      let url = document.getElementById("teacherPhotoUrl").value;
      let file = document.getElementById("teacherPhotoUpload").files[0];
      let photo = "https://randomuser.me/api/portraits/lego/1.jpg";
      if (file) photo = await fileToBase64(file);
      else if (url) photo = url;
      addTeacher({ name, designation: des, phone, photo });
      document.getElementById("addTeacherForm").classList.remove("show");
      document.getElementById("teacherName").value = "";
      document.getElementById("teacherDesignation").value = "";
      document.getElementById("teacherPhone").value = "";
      document.getElementById("teacherPhotoUrl").value = "";
      document.getElementById("teacherPhotoUpload").value = "";
    });

  document
    .getElementById("showAddNoticeForm")
    ?.addEventListener("click", () => {
      document.getElementById("addNoticeForm").classList.toggle("show");
    });

  document
    .getElementById("addNoticeBtn")
    ?.addEventListener("click", async () => {
      let title = document.getElementById("noticeTitle").value;
      let desc = document.getElementById("noticeDesc").value;
      let date = document.getElementById("noticeDate").value;
      let file = document.getElementById("noticeImage").files[0];
      let image = "";
      if (file) image = await fileToBase64(file);
      addNotice({
        title,
        description: desc,
        image,
        date: date || new Date().toISOString().slice(0, 10),
      });
      document.getElementById("addNoticeForm").classList.remove("show");
      document.getElementById("noticeTitle").value = "";
      document.getElementById("noticeDesc").value = "";
      document.getElementById("noticeImage").value = "";
      document.getElementById("noticeDate").value = "";
    });

  document.getElementById("showAddImageForm")?.addEventListener("click", () => {
    document.getElementById("addImageForm").classList.toggle("show");
  });

  document
    .getElementById("addGalleryBtn")
    ?.addEventListener("click", async () => {
      let file = document.getElementById("galleryFileUpload").files[0];
      let title = document.getElementById("galleryTitle").value;
      if (!file) return alert("Select an image");
      let url = await fileToBase64(file);
      addGalleryItem({ url, title: title || "Memory" });
      document.getElementById("addImageForm").classList.remove("show");
      document.getElementById("galleryFileUpload").value = "";
      document.getElementById("galleryTitle").value = "";
    });

  document
    .getElementById("deleteAllRatingsBtn")
    ?.addEventListener("click", async () => {
      if (confirm("Delete all ratings?")) deleteAllRatings();
    });
}

function toggleMobileMenu() {
  let toggle = document.getElementById("menuToggle");
  if (toggle) {
    toggle.onclick = () =>
      document.getElementById("navLinks").classList.toggle("show");
  }
}

// ============ EXPOSE TO WINDOW ============

window.navigate = navigate;
window.copyToClipboard = copyToClipboard;
window.showFullImage = showFullImage;
window.closeModal = closeModal;

// ============ INITIALIZE ============

checkAdminSession();
loadDataFromJSONBin();
