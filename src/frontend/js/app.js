import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "@fontsource/poppins/300.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "../css/style.css";

import * as bootstrap from "bootstrap";
window.bootstrap = bootstrap;

document.addEventListener("DOMContentLoaded", () => {
  // LOGIN PAGE LOGIC
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      const data = Object.fromEntries(formData.entries());

      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          window.location.href = "/";
        } else {
          const result = await res.json();
          const alertBox = document.getElementById("error-alert");
          const msgBox = document.getElementById("error-message");
          msgBox.textContent = result.error || "Login failed";
          alertBox.classList.remove("d-none");
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  // DASHBOARD LOGIC
  const dashboardContainer = document.getElementById("active-cycle-view");
  const noCycleContainer = document.getElementById("no-cycle-view");
  const loadingSpinner = document.getElementById("loading");

  if (dashboardContainer || noCycleContainer) {
    loadDashboard();
  }

  async function loadDashboard() {
    try {
      const res = await fetch("/api/dashboard");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!res.ok) {
        throw new Error(`Server Error: ${res.status} ${res.statusText}`);
      }

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        window.location.href = "/login";
        return;
      }

      const data = await res.json();

      if (data.active) {
        if (noCycleContainer) noCycleContainer.classList.add("d-none");
        if (dashboardContainer) dashboardContainer.classList.remove("d-none");
        renderDashboard(data);
      } else {
        if (dashboardContainer) dashboardContainer.classList.add("d-none");
        if (noCycleContainer) noCycleContainer.classList.remove("d-none");
      }
    } catch (err) {
      console.error("Failed to load dashboard", err);
      // Show error in UI
      if (dashboardContainer) {
        dashboardContainer.innerHTML = `<div class="alert alert-danger m-3">Gagal memuat data: ${err.message}</div>`;
        dashboardContainer.classList.remove("d-none");
      }
    } finally {
      if (loadingSpinner) loadingSpinner.classList.add("d-none");
    }
  }

  function renderDashboard(data) {
    // Header
    setText("kandang-name", data.siklus.nama_kandang);
    setText("umur-hari", data.stat.umur);
    setText("populasi-hidup", formatNumber(data.stat.hidup));

    // Stats
    setText("stat-fcr", data.stat.fcr);
    setText("stat-ip", data.stat.ip);
    setText("stat-bw", data.stat.bw_last);
    setText("stat-sisa-pakan", formatNumber(data.stat.sisa_pakan));
    setText("stat-sisa-sak", data.stat.sisa_sak);

    // Sales
    setText("sales-omzet", formatNumber(data.sales.omzet));
    setText("sales-ekor", formatNumber(data.sales.ekor));
    setText("sales-kg", data.sales.kg.toFixed(1));

    // History
    const historyList = document.getElementById("history-list");
    if (historyList) {
      historyList.innerHTML = "";
      if (data.history.length === 0) {
        historyList.innerHTML =
          '<div class="text-center py-4 text-muted small bg-white rounded-3">Belum ada data harian masuk.</div>';
      } else {
        data.history.forEach((r) => {
          const date = new Date(r.tanggal).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          const item = `
                        <div class="history-card position-relative">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div class="fw-bold text-dark">${date}</div>
                                <span class="badge bg-light text-dark border rounded-pill">Hari ke-${r.umur_hari}</span>
                            </div>
                            
                            <div class="d-flex justify-content-between small text-muted mt-2">
                                <div class="text-center">
                                    <i class="fas fa-skull text-danger me-1"></i> ${r.mati}
                                </div>
                                <div class="text-center">
                                    <i class="fas fa-utensils text-primary me-1"></i> ${r.pakan_harian}
                                </div>
                                <div class="text-center">
                                    <i class="fas fa-weight text-warning me-1"></i> ${r.body_weight}
                                </div>
                            </div>
                        </div>
                    `;
          historyList.insertAdjacentHTML("beforeend", item);
        });
      }
    }
  }

  // Helper
  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function formatNumber(num) {
    return new Intl.NumberFormat("id-ID").format(num);
  }

  // FORMS
  setupForm("formInputHarian", "/api/daily-input");
  setupForm("formStok", "/api/stock");
  setupForm("formMulaiSiklus", "/api/cycle/start");
  setupForm("formJual", "/api/sales");
  setupForm("formTutupSiklus", "/api/cycle/close");

  function setupForm(formId, url) {
    const form = document.getElementById(formId);
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          if (res.ok) {
            // Close modal (Bootstrap specific)
            const modalEl = form.closest(".modal");
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();

            // Reload dashboard
            loadDashboard();
            form.reset();
          } else {
            alert("Gagal menyimpan data");
          }
        } catch (err) {
          console.error(err);
          alert("Terjadi kesalahan");
        }
      });
    }
  }

  // LOGOUT
  const logoutBtns = [
    document.getElementById("logout-btn-1"),
    document.getElementById("logout-btn-2"),
  ];
  logoutBtns.forEach((btn) => {
    if (btn) {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        await fetch("/api/logout", { method: "POST" });
        window.location.href = "/login";
      });
    }
  });

  // INITIALIZATION (Dates & Logic)
  const today = new Date().toISOString().split("T")[0];
  if (document.getElementById("input-tanggal"))
    document.getElementById("input-tanggal").value = today;
  if (document.getElementById("stok-tanggal"))
    document.getElementById("stok-tanggal").value = today;
  if (document.getElementById("mulai-tanggal"))
    document.getElementById("mulai-tanggal").value = today;
  if (document.getElementById("jual-tanggal"))
    document.getElementById("jual-tanggal").value = today;
  if (document.getElementById("tutup-tanggal"))
    document.getElementById("tutup-tanggal").value = today;

  // Stock Conversion Logic
  const unitSelect = document.getElementById("unitSelect");
  const jumlahStok = document.getElementById("jumlahStok");

  function updateStokDisplay() {
    const unit = unitSelect.value;
    const jumlah = parseFloat(jumlahStok.value) || 0;

    if (unit === "sak") {
      const totalKg = jumlah * 50;
      const stokConvert = document.getElementById("stokConvert");
      if (stokConvert) {
        stokConvert.style.display = "block";
        document.getElementById("totalKg").innerText = totalKg.toFixed(2);
      }
    } else {
      const stokConvert = document.getElementById("stokConvert");
      if (stokConvert) stokConvert.style.display = "none";
    }
  }

  if (unitSelect && jumlahStok) {
    unitSelect.addEventListener("change", updateStokDisplay);
    jumlahStok.addEventListener("input", updateStokDisplay);
  }
});
