"use strict";

// 給与所得控除
function deduction(g) {
  if (g <= 1625000) return 550000;
  if (g <= 1800000) return g * 0.4 - 100000;
  if (g <= 3600000) return g * 0.3 + 80000;
  if (g <= 6600000) return g * 0.2 + 440000;
  if (g <= 8500000) return g * 0.1 + 1100000;
  return 1950000;
}

// 所得税の速算（基準税額・復興税前）
function incomeTaxBase(ti) {
  if (ti <= 1950000) return ti * 0.05;
  if (ti <= 3300000) return ti * 0.10 - 97500;
  if (ti <= 6950000) return ti * 0.20 - 427500;
  if (ti <= 9000000) return ti * 0.23 - 636000;
  if (ti <= 18000000) return ti * 0.33 - 1536000;
  if (ti <= 40000000) return ti * 0.40 - 2796000;
  return ti * 0.45 - 4796000;
}

// 手取り概算
function simulate(grossYen, dependents) {
  dependents = dependents || 0;

  var salaryIncome = Math.max(0, grossYen - deduction(grossYen));

  // 社会保険料（概算 15%）
  var shaho = Math.floor(grossYen * 0.15);

  // 所得税（復興特別所得税込み）
  var tiRaw = Math.max(0, salaryIncome - shaho - 480000 - 380000 * dependents);
  var ti = Math.floor(tiRaw / 1000) * 1000; // 1000円未満切り捨て
  var incomeTax = Math.floor(Math.max(0, incomeTaxBase(ti)) * 1.021);

  // 住民税（概算・標準税率）
  var tr = Math.max(0, salaryIncome - shaho - 430000 - 330000 * dependents);
  var shotokuwari = Math.floor(tr * 0.10);
  var kintouwari = tr > 0 ? 5000 : 0;
  var residentTax = shotokuwari + kintouwari;

  var tedori = grossYen - shaho - incomeTax - residentTax;

  return {
    gross: grossYen,
    shaho: shaho,
    incomeTax: incomeTax,
    residentTax: residentTax,
    tedori: tedori,
    tedoriMonthly: Math.floor(tedori / 12),
    rate: tedori / grossYen * 100
  };
}

var formatYen = function (v) {
  return v.toLocaleString("ja-JP") + " 円";
};

// ===== DOM（ブラウザ実行時のみ） =====
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("sim-form");
    if (!form) return;

    var incomeEl = document.getElementById("income");
    var dependentsEl = document.getElementById("dependents");
    var errorEl = document.getElementById("form-error");
    var resultEl = document.getElementById("result");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errorEl.textContent = "";

      var incomeMan = parseFloat(incomeEl.value);
      var depRaw = dependentsEl.value.trim();
      var dependents = depRaw === "" ? 0 : parseInt(depRaw, 10);

      if (isNaN(incomeMan) || incomeMan <= 0) {
        errorEl.textContent = "年収は正の数で入力してください。";
        resultEl.hidden = true;
        resultEl.classList.remove("visible");
        return;
      }
      if (isNaN(dependents) || dependents < 0 || !Number.isInteger(dependents)) {
        errorEl.textContent = "扶養人数は0以上の整数で入力してください。";
        resultEl.hidden = true;
        resultEl.classList.remove("visible");
        return;
      }

      var grossYen = Math.round(incomeMan * 10000);
      var r = simulate(grossYen, dependents);

      resultEl.innerHTML =
        '<h2>計算結果（概算）</h2>' +
        '<div class="result-tedori">' +
          '<p class="tedori-label">手取り年額（概算）</p>' +
          '<p class="tedori-value">' + formatYen(r.tedori) + '</p>' +
          '<p class="tedori-monthly">月あたり 約 ' + formatYen(r.tedoriMonthly) + '</p>' +
        '</div>' +
        '<div class="result-grid">' +
          '<div class="result-card"><p class="rc-label">額面年収</p><p class="rc-value">' + formatYen(r.gross) + '</p></div>' +
          '<div class="result-card"><p class="rc-label">社会保険料</p><p class="rc-value">' + formatYen(r.shaho) + '</p></div>' +
          '<div class="result-card"><p class="rc-label">所得税</p><p class="rc-value">' + formatYen(r.incomeTax) + '</p></div>' +
          '<div class="result-card"><p class="rc-label">住民税</p><p class="rc-value">' + formatYen(r.residentTax) + '</p></div>' +
        '</div>' +
        '<p class="result-rate">手取り率 約 ' + r.rate.toFixed(1) + '％</p>' +
        '<p class="result-note">※ あくまで概算です。詳しくは下の注意書きをご覧ください。</p>';

      resultEl.hidden = false;
      // フェードイン
      void resultEl.offsetWidth;
      resultEl.classList.add("visible");
    });
  });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { simulate: simulate, deduction: deduction };
}
