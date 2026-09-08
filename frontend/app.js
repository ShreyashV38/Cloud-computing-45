/**
 * University Notice Board — Frontend Application Logic
 *
 * All API calls go through the nginx reverse-proxy → API Gateway.
 * The browser only ever talks to the same origin (port 8080).
 */

(function () {
  "use strict";

  // ==================== Constants ====================
  const API_BASE = "/api"; // proxied by nginx → gateway
  const NOTICES_URL = `${API_BASE}/notices`;
  const FEEDBACK_URL = `${API_BASE}/feedback`;
  const PAGE_LIMIT = 10;

  // ==================== DOM References ====================
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // Tabs
  const tabButtons = $$(".tab-btn");
  const views = $$(".view");

  // Notice elements
  const noticeForm = $("#notice-form");
  const noticeTitle = $("#notice-title");
  const noticeMessage = $("#notice-message");
  const noticeAuthor = $("#notice-author");
  const noticeMsgCount = $("#notice-msg-count");
  const noticeList = $("#notices-list");
  const noticePagination = $("#notices-pagination");
  const noticeFormError = $("#notice-form-error");
  const noticeFormSuccess = $("#notice-form-success");
  const btnPostNotice = $("#btn-post-notice");

  // Feedback elements
  const feedbackForm = $("#feedback-form");
  const fbName = $("#fb-name");
  const fbMessage = $("#fb-message");
  const fbMsgCount = $("#fb-msg-count");
  const feedbackList = $("#feedback-list");
  const feedbackPagination = $("#feedback-pagination");
  const feedbackFormError = $("#feedback-form-error");
  const feedbackFormSuccess = $("#feedback-form-success");
  const btnPostFeedback = $("#btn-post-feedback");

  // ==================== State ====================
  let currentNoticesPage = 1;
  let currentFeedbackPage = 1;

  // ==================== Tab Switching ====================
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;

      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      views.forEach((v) => v.classList.remove("active"));
      $(`#view-${tab}`).classList.add("active");

      // Load data when switching to a tab
      if (tab === "notices") loadNotices(1);
      if (tab === "feedback") loadFeedback(1);
    });
  });

  // ==================== Character Counters ====================
  noticeMessage.addEventListener("input", () => {
    noticeMsgCount.textContent = `${noticeMessage.value.length} / 5000`;
  });

  fbMessage.addEventListener("input", () => {
    fbMsgCount.textContent = `${fbMessage.value.length} / 2000`;
  });

  // ==================== Helpers ====================

  /** Format an ISO date string into a readable format. */
  function formatDate(isoStr) {
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /** Show an inline form message, auto-hide after delay. */
  function showMsg(el, text, duration = 4000) {
    el.textContent = text;
    el.classList.remove("hidden");
    setTimeout(() => el.classList.add("hidden"), duration);
  }

  /** Set loading state on a button. */
  function setLoading(btn, loading) {
    const label = btn.querySelector(".btn__label");
    const spinner = btn.querySelector(".btn__spinner");
    btn.disabled = loading;
    label.style.opacity = loading ? "0.4" : "1";
    spinner.classList.toggle("hidden", !loading);
  }

  /** Build pagination controls. */
  function renderPagination(container, page, totalPages, onPageChange) {
    if (totalPages <= 1) {
      container.classList.add("hidden");
      return;
    }

    container.classList.remove("hidden");
    container.innerHTML = `
      <button ${page <= 1 ? "disabled" : ""} data-page="${page - 1}">← Prev</button>
      <span class="page-info">Page ${page} of ${totalPages}</span>
      <button ${page >= totalPages ? "disabled" : ""} data-page="${page + 1}">Next →</button>
    `;

    container.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = parseInt(btn.dataset.page, 10);
        if (p >= 1 && p <= totalPages) onPageChange(p);
      });
    });
  }

  // ==================== Notices ====================

  async function loadNotices(page) {
    currentNoticesPage = page;
    noticeList.innerHTML = '<div class="skeleton-loader">Loading notices…</div>';

    try {
      const res = await fetch(`${NOTICES_URL}?page=${page}&limit=${PAGE_LIMIT}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (!json.data || json.data.length === 0) {
        noticeList.innerHTML = `
          <div class="empty-state">
            <span class="empty-state__icon">📭</span>
            No notices yet. Be the first to post one!
          </div>`;
        noticePagination.classList.add("hidden");
        return;
      }

      noticeList.innerHTML = json.data
        .map(
          (n) => `
        <div class="item-card item-card--notice">
          <div class="item-card__title">${escapeHtml(n.title)}</div>
          <div class="item-card__body">${escapeHtml(n.message)}</div>
          <div class="item-card__meta">
            <span>👤 ${escapeHtml(n.posted_by)}</span>
            <span>📅 ${formatDate(n.created_at)}</span>
          </div>
        </div>`
        )
        .join("");

      renderPagination(noticePagination, json.page, json.totalPages, loadNotices);
    } catch (err) {
      noticeList.innerHTML = `
        <div class="empty-state">
          <span class="empty-state__icon">⚠️</span>
          Failed to load notices. Is the server running?
        </div>`;
      console.error("loadNotices error:", err);
    }
  }

  noticeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    noticeFormError.classList.add("hidden");
    noticeFormSuccess.classList.add("hidden");
    setLoading(btnPostNotice, true);

    const payload = {
      title: noticeTitle.value.trim(),
      message: noticeMessage.value.trim(),
      posted_by: noticeAuthor.value.trim(),
    };

    try {
      const res = await fetch(NOTICES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg = json.errors ? json.errors.join(" ") : json.error || "Unknown error";
        showMsg(noticeFormError, msg);
        return;
      }

      showMsg(noticeFormSuccess, "✅ Notice published successfully!");
      noticeForm.reset();
      noticeMsgCount.textContent = "0 / 5000";
      loadNotices(1);
    } catch (err) {
      showMsg(noticeFormError, "Network error — could not reach the server.");
      console.error("postNotice error:", err);
    } finally {
      setLoading(btnPostNotice, false);
    }
  });

  // ==================== Feedback ====================

  async function loadFeedback(page) {
    currentFeedbackPage = page;
    feedbackList.innerHTML = '<div class="skeleton-loader">Loading feedback…</div>';

    try {
      const res = await fetch(`${FEEDBACK_URL}?page=${page}&limit=${PAGE_LIMIT}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (!json.data || json.data.length === 0) {
        feedbackList.innerHTML = `
          <div class="empty-state">
            <span class="empty-state__icon">💬</span>
            No feedback yet. Share your thoughts!
          </div>`;
        feedbackPagination.classList.add("hidden");
        return;
      }

      feedbackList.innerHTML = json.data
        .map(
          (f) => `
        <div class="item-card item-card--feedback">
          <div class="item-card__body">${escapeHtml(f.message)}</div>
          <div class="item-card__meta">
            <span>👤 ${escapeHtml(f.student_name)}</span>
            <span>📅 ${formatDate(f.submitted_at)}</span>
          </div>
        </div>`
        )
        .join("");

      renderPagination(feedbackPagination, json.page, json.totalPages, loadFeedback);
    } catch (err) {
      feedbackList.innerHTML = `
        <div class="empty-state">
          <span class="empty-state__icon">⚠️</span>
          Failed to load feedback. Is the server running?
        </div>`;
      console.error("loadFeedback error:", err);
    }
  }

  feedbackForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    feedbackFormError.classList.add("hidden");
    feedbackFormSuccess.classList.add("hidden");
    setLoading(btnPostFeedback, true);

    const payload = {
      student_name: fbName.value.trim(),
      message: fbMessage.value.trim(),
    };

    try {
      const res = await fetch(FEEDBACK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg = json.errors ? json.errors.join(" ") : json.error || "Unknown error";
        showMsg(feedbackFormError, msg);
        return;
      }

      showMsg(feedbackFormSuccess, "✅ Feedback submitted — thank you!");
      feedbackForm.reset();
      fbMsgCount.textContent = "0 / 2000";
      loadFeedback(1);
    } catch (err) {
      showMsg(feedbackFormError, "Network error — could not reach the server.");
      console.error("postFeedback error:", err);
    } finally {
      setLoading(btnPostFeedback, false);
    }
  });

  // ==================== XSS Protection ====================

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ==================== Init ====================
  loadNotices(1);
})();
