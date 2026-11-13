/* Real Calculator — FS tools: small calculator on the Assumptions sheet.
   Type an expression with the keyboard (e.g. 6000*4,5), read the result, copy it into a cell. */
(function () {
  "use strict";
  var app = document.getElementById("fs-app");
  if (!app) return;
  var vi = function () {
    return (document.documentElement.lang || "vi") !== "en";
  };
  var T = {
    title: ["Calculator", "Máy tính"],
    hide: ["Minimise", "Thu nhỏ"],
    ph: ["e.g. 6000*4,5", "VD: 6000*4,5"],
    copy: ["Copy", "Chép"],
    copied: ["Copied", "Đã chép"],
    err: ["Check the expression", "Kiểm tra lại phép tính"],
  };
  var L = function (k) {
    return T[k][vi() ? 1 : 0];
  };
  var box = document.createElement("div");
  box.className = "fs-calc";
  var pill = document.createElement("button");
  pill.type = "button";
  pill.className = "fs-calc-pill";
  document.body.appendChild(box);
  document.body.appendChild(pill);
  var value = null,
    collapsed = false,
    lang = null;
  try {
    collapsed = localStorage.getItem("fslab.fspro.calc") === "min";
  } catch (e) {}

  function render() {
    var keep = box.querySelector("input") ? box.querySelector("input").value : "";
    lang = document.documentElement.lang || "vi";
    box.setAttribute("aria-label", L("title"));
    box.innerHTML =
      '<div class="fs-calc-h"><span>' + L("title") + '</span><button type="button" data-c="min" aria-label="' + L("hide") + '" title="' + L("hide") + '">–</button></div>' +
      '<input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="' + L("ph") + '" aria-label="' + L("title") + '">' +
      '<div class="fs-calc-o"><output class="fs-calc-r" aria-live="polite"></output><button type="button" data-c="copy" disabled>' + L("copy") + "</button></div>";
    pill.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 7h8M8 12h2M12 12h2M8 16h2M12 16h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' + L("title");
    pill.setAttribute("aria-label", L("title"));
    box.querySelector("input").value = keep;
    calc();
  }

  /* safe evaluator: numbers (Vietnamese "," decimal, "." thousands), + − × ÷ % and brackets */
  function evaluate(src) {
    var s = String(src).replace(/\s/g, "").replace(/[×xX]/g, "*").replace(/÷|:/g, "/").replace(/−/g, "-");
    if (s.charAt(0) === "=") s = s.slice(1);
    if (!s) return null;
    if (/[^0-9.,+\-*/()%]/.test(s)) return NaN;
    var i = 0;
    function num(t) {
      if (vi()) {
        if (t.indexOf(",") >= 0) t = t.replace(/\./g, "").replace(",", ".");
        else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
      } else t = t.replace(/,/g, "");
      return Number(t);
    }
    function expr() {
      var v = term();
      while (s[i] === "+" || s[i] === "-") {
        var o = s[i++], r = term();
        v = o === "+" ? v + r : v - r;
      }
      return v;
    }
    function term() {
      var v = fact();
      while (s[i] === "*" || s[i] === "/") {
        var o = s[i++], r = fact();
        v = o === "*" ? v * r : v / r;
      }
      return v;
    }
    function fact() {
      var v;
      if (s[i] === "-") return i++, -fact();
      if (s[i] === "+") return i++, fact();
      if (s[i] === "(") {
        i++;
        v = expr();
        if (s[i] !== ")") throw 0;
        i++;
      } else {
        var m = /^[\d.,]+/.exec(s.slice(i));
        if (!m) throw 0;
        i += m[0].length;
        v = num(m[0]);
      }
      while (s[i] === "%") i++, (v = v / 100);
      return v;
    }
    try {
      var v = expr();
      return i === s.length && isFinite(v) ? v : NaN;
    } catch (e) {
      return NaN;
    }
  }
  function fmt(v) {
    return new Intl.NumberFormat(vi() ? "vi-VN" : "en-US", { maximumFractionDigits: 6 }).format(Math.round(v * 1e6) / 1e6);
  }
  function calc(final) {
    var inp = box.querySelector("input"),
      o = box.querySelector(".fs-calc-r"),
      b = box.querySelector('[data-c="copy"]'),
      v = evaluate(inp.value);
    value = v === null || isNaN(v) ? null : v;
    o.className = "fs-calc-r" + (v !== null && isNaN(v) && final ? " err" : "");
    o.textContent = value !== null ? "= " + fmt(value) : v !== null && isNaN(v) && final ? L("err") : "";
    b.disabled = value === null;
  }
  box.addEventListener("input", function () {
    calc(false);
  });
  box.addEventListener("keydown", function (e) {
    if (e.target.tagName !== "INPUT") return;
    if (e.key === "Enter") e.preventDefault(), calc(true);
    if (e.key === "Escape") (e.target.value = ""), calc(false);
  });
  box.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.c === "min") return setCollapsed(true);
    if (b.dataset.c === "copy" && value !== null) {
      /* copied in the sheet's own number style, so it can be pasted straight into a blue cell */
      var t = new Intl.NumberFormat(vi() ? "vi-VN" : "en-US", { maximumFractionDigits: 6, useGrouping: false }).format(Math.round(value * 1e6) / 1e6);
      var done = function () {
        b.textContent = L("copied");
        setTimeout(function () {
          b.textContent = L("copy");
        }, 1300);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, function () {});
    }
  });
  pill.addEventListener("click", function () {
    setCollapsed(false);
    box.querySelector("input").focus();
  });
  function setCollapsed(c) {
    collapsed = c;
    try {
      localStorage.setItem("fslab.fspro.calc", c ? "min" : "open");
    } catch (e) {}
    place();
  }
  /* shown only on the Assumptions sheet; sits just right of the "Checks" tile, under the KPI band */
  function place() {
    var tab = app.querySelector('.fs-rail [aria-selected="true"]'),
      onIn = !!tab && tab.getAttribute("data-tab") === "in";
    var ar = app.getBoundingClientRect(), vh = window.innerHeight || 800, away = ar.bottom < 260 || ar.top > vh - 120 || document.documentElement.clientWidth < 900;
    box.hidden = !onIn || collapsed || away;
    pill.hidden = !onIn || !collapsed || away;
    var kp = app.querySelector(".kpis"),
      chk = app.querySelector(".kpis .kpi.chk"),
      main = app.querySelector(".fs-main"),
      vw = document.documentElement.clientWidth,
      w = 176;
    var top = kp ? Math.max(kp.getBoundingClientRect().bottom, 0) + 10 : 90;
    var shell = app.querySelector(".fs-shell");
    if (shell) top = Math.max(top, shell.getBoundingClientRect().top + 92);
    var left;
    if (vw >= 1100 && chk) {
      var cr = chk.getBoundingClientRect(),
        mr = main ? main.getBoundingClientRect().right : cr.right;
      left = Math.min(vw - w - 8, Math.max(cr.left + 24, mr + 10));
      [box, pill].forEach(function (el) {
        el.style.left = left + "px";
        el.style.top = Math.min(top, (window.innerHeight || 800) - (el.offsetHeight || 150) - 96) + "px";
        el.style.bottom = "";
      });
    } else {
      [box, pill].forEach(function (el) {
        el.style.left = "12px";
        el.style.top = "";
        el.style.bottom = "16px";
      });
    }
  }
  new MutationObserver(function () {
    if ((document.documentElement.lang || "vi") !== lang) render();
    place();
  }).observe(app, { childList: true, subtree: false });
  window.addEventListener("scroll", place, { passive: true });
  window.addEventListener("resize", place);
  render();
  place();
})();
