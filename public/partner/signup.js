/*!
 * custix.ai – Registrierformular für Partnerseiten (ADR-0011)
 *
 * Einbindung auf der Partnerseite:
 *   <div id="custix-signup" data-partner="finditoo"></div>
 *   <script src="https://custix.ai/partner/signup.js" defer></script>
 *
 * Legt über custix.ai ein Konto mit 14-tägiger Testphase an und zeigt danach
 * die Download-Links der Desktop-App. Die Daten gehen direkt an custix.ai,
 * nicht an den Partner. Kein Cookie, keine Sitzung auf der Partnerseite.
 *
 * Aussehen über CSS-Variablen anpassbar (am inneren .cxs-root, der sie setzt):
 *   #custix-signup .cxs-root { --cxs-primary: #3D00FF; --cxs-ink: #1B1635; ... }
 */
(function () {
  "use strict";

  var script = document.currentScript;
  var API = script && script.src ? new URL(script.src).origin : "https://custix.ai";
  var TURNSTILE_SRC =
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

  var PLATFORMS = {
    "windows-x86_64": {
      label: "Windows",
      hint: "Beim ersten Start zeigt Windows „Der Computer wurde durch Windows geschützt“: auf „Weitere Informationen“ und dann „Trotzdem ausführen“ klicken.",
    },
    "darwin-aarch64": {
      label: "macOS (Apple Silicon)",
      hint: "Beim ersten Start warnt macOS: im Finder mit Rechtsklick auf custix.app → „Öffnen“ und im Dialog bestätigen.",
    },
    "darwin-x86_64": {
      label: "macOS (Intel)",
      hint: "Beim ersten Start warnt macOS: im Finder mit Rechtsklick auf custix.app → „Öffnen“ und im Dialog bestätigen.",
    },
  };

  var ERRORS = {
    email_taken:
      "Für diese E-Mail-Adresse gibt es bereits ein custix-Konto. Melden Sie sich direkt in der App an – das Passwort können Sie auf <a href=\"" +
      API +
      "/konto\" target=\"_blank\" rel=\"noopener\">custix.ai/konto</a> zurücksetzen.",
    turnstile_failed:
      "Die Sicherheitsprüfung ist fehlgeschlagen. Bitte versuchen Sie es noch einmal.",
    rate_limited:
      "Zu viele Versuche in kurzer Zeit. Bitte warten Sie eine Minute.",
    partner_disabled: "Die Registrierung ist gerade nicht verfügbar.",
    origin_not_allowed:
      "Dieses Formular ist für diese Seite noch nicht freigeschaltet. Bitte wenden Sie sich an custix.ai.",
    turnstile_unavailable:
      "Die Sicherheitsprüfung konnte nicht geladen werden. Bitte laden Sie die Seite neu oder prüfen Sie Werbe- und Skriptblocker.",
    network:
      "Keine Verbindung zu custix.ai. Bitte prüfen Sie Ihre Internetverbindung.",
    generic:
      "Das hat leider nicht geklappt. Bitte versuchen Sie es noch einmal oder registrieren Sie sich direkt auf <a href=\"" +
      API +
      "/konto\" target=\"_blank\" rel=\"noopener\">custix.ai</a>.",
  };

  var FIELD_ERRORS = {
    name: "Bitte geben Sie Ihren Namen an.",
    company: "Bitte geben Sie Ihre Kanzlei an.",
    email: "Bitte geben Sie eine gültige E-Mail-Adresse an.",
    password: "Das Passwort braucht mindestens 8 Zeichen.",
    password2: "Die Passwörter stimmen nicht überein.",
  };

  var CSS =
    ".cxs-root{--cxs-primary:#3D00FF;--cxs-primary-hover:#3200d1;--cxs-ink:#1B1635;--cxs-text:#4a4760;--cxs-muted:#7a7890;--cxs-border:#dcdae6;--cxs-bg:#ffffff;--cxs-soft:#f5f4fa;--cxs-error:#b42318;--cxs-radius:6px;--cxs-font:inherit;" +
    "font-family:var(--cxs-font);color:var(--cxs-text);background:var(--cxs-bg);border:1px solid var(--cxs-border);border-radius:calc(var(--cxs-radius)*2);padding:32px;max-width:520px;margin:0 auto;box-sizing:border-box;text-align:left;line-height:1.5}" +
    ".cxs-root *{box-sizing:border-box}" +
    ".cxs-root h3.cxs-h{font-family:var(--cxs-font);color:var(--cxs-ink);font-size:22px;font-weight:600;margin:0 0 4px;line-height:1.3}" +
    ".cxs-root p.cxs-sub{margin:0 0 20px;font-size:15px;color:var(--cxs-text)}" +
    ".cxs-root .cxs-field{margin:0 0 14px}" +
    ".cxs-root label.cxs-label{display:block;font-size:14px;font-weight:600;color:var(--cxs-ink);margin:0 0 6px}" +
    ".cxs-root input.cxs-input{display:block;width:100%;font:inherit;font-size:15px;color:var(--cxs-ink);background:#fff;border:1px solid var(--cxs-border);border-radius:var(--cxs-radius);padding:11px 14px;margin:0;outline:none;box-shadow:none;transition:border-color .15s}" +
    ".cxs-root input.cxs-input:focus{border-color:var(--cxs-primary);box-shadow:0 0 0 3px rgba(61,0,255,.12)}" +
    ".cxs-root input.cxs-input[aria-invalid=true]{border-color:var(--cxs-error)}" +
    ".cxs-root .cxs-ferr{display:block;font-size:13px;color:var(--cxs-error);margin-top:4px}" +
    ".cxs-root .cxs-ferr:empty{display:none}" +
    ".cxs-root .cxs-ts{margin:4px 0 14px;min-height:0}" +
    ".cxs-root button.cxs-btn,.cxs-root a.cxs-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;font:inherit;font-size:16px;font-weight:600;color:#fff;background:var(--cxs-primary);border:0;border-radius:var(--cxs-radius);padding:14px 20px;cursor:pointer;text-decoration:none;transition:background .15s}" +
    ".cxs-root button.cxs-btn:hover,.cxs-root a.cxs-btn:hover{background:var(--cxs-primary-hover);color:#fff}" +
    ".cxs-root button.cxs-btn[disabled]{opacity:.6;cursor:default}" +
    ".cxs-root a.cxs-btn.cxs-alt{background:#fff;color:var(--cxs-ink);border:1px solid var(--cxs-border)}" +
    ".cxs-root a.cxs-btn.cxs-alt:hover{border-color:var(--cxs-ink);background:#fff;color:var(--cxs-ink)}" +
    ".cxs-root .cxs-err{margin:0 0 14px;padding:12px 14px;border-radius:var(--cxs-radius);background:#fef3f2;color:var(--cxs-error);font-size:14px}" +
    ".cxs-root .cxs-err:empty{display:none}" +
    ".cxs-root .cxs-err a,.cxs-root .cxs-legal a,.cxs-root .cxs-note a{color:inherit;text-decoration:underline}" +
    ".cxs-root p.cxs-legal{margin:14px 0 0;font-size:12px;color:var(--cxs-muted);text-align:center}" +
    ".cxs-root .cxs-steps{margin:20px 0 0;padding:0;list-style:none}" +
    ".cxs-root .cxs-steps>li{margin:0 0 20px;padding:0}" +
    ".cxs-root .cxs-step{display:block;font-weight:600;color:var(--cxs-ink);margin:0 0 8px;font-size:15px}" +
    ".cxs-root .cxs-dl{display:grid;gap:8px}" +
    ".cxs-root .cxs-hint{font-size:12px;color:var(--cxs-muted);margin:6px 0 0}" +
    ".cxs-root .cxs-note{margin:0;padding:12px 14px;border-radius:var(--cxs-radius);background:var(--cxs-soft);font-size:14px}" +
    ".cxs-root .cxs-ok{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:rgba(61,0,255,.1);color:var(--cxs-primary);font-size:20px;font-weight:700;margin:0 0 12px}" +
    ".cxs-root .cxs-spin{width:16px;height:16px;border:2px solid rgba(255,255,255,.5);border-top-color:#fff;border-radius:50%;animation:cxs-spin .7s linear infinite}" +
    "@keyframes cxs-spin{to{transform:rotate(360deg)}}" +
    "@media (max-width:480px){.cxs-root{padding:22px 18px}}";

  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    if (attrs) for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (html != null) node.innerHTML = html;
    return node;
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function injectCss() {
    if (document.getElementById("custix-signup-css")) return;
    var style = el("style", { id: "custix-signup-css" });
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  var turnstileReady = null;
  function loadTurnstile() {
    if (turnstileReady) return turnstileReady;
    turnstileReady = new Promise(function (resolve, reject) {
      if (window.turnstile) return resolve(window.turnstile);
      var s = el("script", { src: TURNSTILE_SRC, async: "", defer: "" });
      s.onload = function () {
        window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile"));
      };
      s.onerror = function () {
        reject(new Error("turnstile"));
      };
      document.head.appendChild(s);
    });
    return turnstileReady;
  }

  function formatDate(epoch) {
    var d = new Date(epoch * 1000);
    return d.toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function isMac() {
    var p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent;
    return /mac/i.test(p);
  }

  function mount(root) {
    if (root.getAttribute("data-cxs-mounted")) return;
    root.setAttribute("data-cxs-mounted", "1");
    var partner = root.getAttribute("data-partner") || "";
    var api = API;
    // Vorschau-Modus (custix.ai/finditoo/): Formular und Erfolgsfeld wie echt,
    // aber ohne Turnstile und ohne Konto – Partner-Konten entstehen nur auf der
    // Partnerseite selbst (ADR-0011).
    var demo = root.hasAttribute("data-demo");

    var box = el("div", { class: "cxs-root" });
    root.innerHTML = "";
    root.appendChild(box);
    box.innerHTML = "<p class=\"cxs-sub\">Formular wird geladen …</p>";

    fetch(api + "/api/partner/config?partner=" + encodeURIComponent(partner), { credentials: "omit" })
      .then(function (r) {
        // Fehler sind lesbar (Access-Control-Allow-Origin: *), damit eine noch
        // nicht freigeschaltete Seite das sagt statt „keine Verbindung“.
        return r.json().then(function (body) {
          return r.ok ? body : Promise.reject(body && body.error);
        });
      })
      .then(function (config) {
        if (!config.enabled && !demo) {
          box.innerHTML =
            "<h3 class=\"cxs-h\">custix 14 Tage kostenlos testen</h3>" +
            "<p class=\"cxs-sub\">Die Registrierung ist in Kürze hier verfügbar. Bis dahin: <a href=\"" +
            api + "/konto\" target=\"_blank\" rel=\"noopener\">direkt auf custix.ai registrieren</a>.</p>";
          return;
        }
        renderForm(box, api, partner, config, demo);
      })
      .catch(function (code) {
        var message =
          code === "origin_not_allowed" || code === "unknown_partner"
            ? ERRORS.origin_not_allowed
            : ERRORS.network;
        box.innerHTML = "<div class=\"cxs-err\">" + message + "</div>";
      });
  }

  var DEMO_NOTE =
    "<p class=\"cxs-note\" style=\"margin-bottom:14px\"><strong>Vorschau:</strong> In dieser Demo wird kein Konto angelegt.</p>";

  function renderForm(box, api, partner, config, demo) {
    // Klassen für gängige Session-Recorder (Hotjar, Clarity, PostHog), damit
    // Eingaben nicht mitgeschnitten werden. Ersetzt nicht die Einstellung im
    // Tracking-Tool selbst – siehe Übergabe-README.
    box.innerHTML =
      "<h3 class=\"cxs-h\">Konto anlegen</h3>" +
      "<p class=\"cxs-sub\">Ihre 14-tägige Testphase startet sofort, ohne Kreditkarte. Anschließend 15 € / Monat oder 150 € / Jahr pro Arbeitsplatz, inkl. USt.</p>" +
      "<form novalidate class=\"cxs-form ph-no-capture\" data-hj-suppress data-clarity-mask=\"true\">" +
      "<div class=\"cxs-err\" role=\"alert\" aria-live=\"polite\"></div>" +
      field("name", "Name", "text", "name") +
      field("company", "Kanzlei", "text", "organization") +
      field("email", "E-Mail", "email", "email") +
      field("password", "Passwort (mind. 8 Zeichen)", "password", "new-password") +
      field("password2", "Passwort wiederholen", "password", "new-password") +
      (demo ? DEMO_NOTE : "<div class=\"cxs-ts\"></div>") +
      "<button type=\"submit\" class=\"cxs-btn\">Kostenlos registrieren</button>" +
      "<p class=\"cxs-legal\">Mit der Registrierung akzeptieren Sie die <a href=\"" + api +
      "/agb\" target=\"_blank\" rel=\"noopener\">AGB</a> und die <a href=\"" + api +
      "/datenschutz\" target=\"_blank\" rel=\"noopener\">Datenschutzerklärung</a> von custix.ai (snekmedia GmbH). Ihre Angaben gehen direkt an custix.ai – " +
      esc(config.partnerName || "der Seitenbetreiber") + " erhält sie nicht.</p>" +
      "</form>";

    var form = box.querySelector("form");
    var errBox = box.querySelector(".cxs-err");
    var button = box.querySelector("button");
    var tsBox = box.querySelector(".cxs-ts");
    var token = null;
    var widgetId = null;
    /** Turnstile nicht ladbar (Blocker, Netz) – dann gleich sagen, nicht „läuft noch“. */
    var turnstileMissing = false;

    if (!demo) loadTurnstile()
      .then(function (ts) {
        widgetId = ts.render(tsBox, {
          sitekey: config.siteKey,
          language: "de",
          appearance: "interaction-only",
          callback: function (t) {
            token = t;
          },
          "expired-callback": function () {
            token = null;
          },
          "error-callback": function () {
            token = null;
          },
        });
      })
      .catch(function () {
        turnstileMissing = true;
        errBox.innerHTML = ERRORS.turnstile_unavailable;
      });

    function input(name) {
      return form.querySelector("[name=\"" + name + "\"]");
    }

    function setFieldError(name, message) {
      var i = input(name);
      i.setAttribute("aria-invalid", message ? "true" : "false");
      form.querySelector("#cxs-err-" + name).textContent = message || "";
    }

    function validate() {
      var ok = true;
      ["name", "company", "email", "password", "password2"].forEach(function (n) {
        setFieldError(n, "");
      });
      if (!input("name").value.trim()) ok = fail("name");
      if (!input("company").value.trim()) ok = fail("company");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input("email").value.trim())) ok = fail("email");
      if (input("password").value.length < 8) ok = fail("password");
      else if (input("password").value !== input("password2").value) ok = fail("password2");
      return ok;
    }

    function fail(name) {
      setFieldError(name, FIELD_ERRORS[name]);
      return false;
    }

    function busy(on) {
      button.disabled = on;
      button.innerHTML = on ? "<span class=\"cxs-spin\"></span> Wird angelegt …" : "Kostenlos registrieren";
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errBox.innerHTML = "";
      if (!validate()) return;
      if (demo) {
        busy(true);
        var demoEmail = input("email").value.trim();
        setTimeout(function () {
          renderSuccess(box, api, config, demoEmail, {
            trialStarted: true,
            expiresAt: Math.floor(Date.now() / 1000) + 14 * 86400,
          }, true);
        }, 600);
        return;
      }
      if (!token) {
        errBox.innerHTML = turnstileMissing
          ? ERRORS.turnstile_unavailable
          : "Die Sicherheitsprüfung läuft noch – bitte einen Moment warten und erneut klicken.";
        return;
      }
      busy(true);
      var email = input("email").value.trim();
      fetch(api + "/api/partner/signup?partner=" + encodeURIComponent(partner), {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: input("name").value.trim(),
          company: input("company").value.trim(),
          email: email,
          password: input("password").value,
          turnstileToken: token,
        }),
      })
        .then(function (r) {
          return r.json().catch(function () {
            return { error: "generic" };
          });
        })
        .then(function (res) {
          if (res && res.ok) {
            renderSuccess(box, api, config, email, res);
            return;
          }
          busy(false);
          // Turnstile-Token gilt nur einmal – für den nächsten Versuch neu holen.
          token = null;
          if (window.turnstile && widgetId != null) window.turnstile.reset(widgetId);
          var code = res && res.error;
          if (code === "invalid_input" && res.field && FIELD_ERRORS[res.field]) {
            fail(res.field);
            input(res.field).focus();
            return;
          }
          errBox.innerHTML = ERRORS[code] || ERRORS.generic;
        })
        .catch(function () {
          busy(false);
          errBox.innerHTML = ERRORS.network;
        });
    });
  }

  function field(name, label, type, autocomplete) {
    return (
      "<div class=\"cxs-field\">" +
      "<label class=\"cxs-label\" for=\"cxs-" + name + "\">" + label + "</label>" +
      "<input class=\"cxs-input\" id=\"cxs-" + name + "\" name=\"" + name + "\" type=\"" + type +
      "\" autocomplete=\"" + autocomplete + "\" aria-describedby=\"cxs-err-" + name + "\"" +
      (type === "password" ? " minlength=\"8\"" : "") + " required>" +
      "<span class=\"cxs-ferr\" id=\"cxs-err-" + name + "\"></span>" +
      "</div>"
    );
  }

  function renderSuccess(box, api, config, email, res, demo) {
    var order = isMac()
      ? ["darwin-aarch64", "darwin-x86_64", "windows-x86_64"]
      : ["windows-x86_64", "darwin-aarch64", "darwin-x86_64"];
    var byPlatform = {};
    (config.downloads || []).forEach(function (d) {
      byPlatform[d.platform] = d.url;
    });
    var buttons = order
      .filter(function (p) {
        return byPlatform[p];
      })
      .map(function (p, i) {
        return (
          "<div><a class=\"cxs-btn" + (i === 0 ? "" : " cxs-alt") + "\" href=\"" + esc(byPlatform[p]) +
          "\" rel=\"noopener\">custix für " + PLATFORMS[p].label + " herunterladen</a>" +
          (i === 0 ? "<p class=\"cxs-hint\">" + PLATFORMS[p].hint + "</p>" : "") +
          "</div>"
        );
      })
      .join("");
    if (!buttons) {
      buttons =
        "<a class=\"cxs-btn\" href=\"" + api + "/download\" target=\"_blank\" rel=\"noopener\">Zur Download-Seite</a>";
    }

    var headline = res.trialStarted
      ? "Ihre Testphase läuft" + (res.expiresAt ? " bis " + formatDate(res.expiresAt) : "")
      : "Ihr Konto ist angelegt";
    var trialNote = res.trialStarted
      ? ""
      : "<p class=\"cxs-note\">Die Testphase konnte nicht automatisch starten. Melden Sie sich auf <a href=\"" +
        api + "/konto\" target=\"_blank\" rel=\"noopener\">custix.ai/konto</a> an und starten Sie sie dort mit einem Klick.</p>";

    box.innerHTML =
      (demo ? DEMO_NOTE : "") +
      "<div class=\"cxs-ok\" aria-hidden=\"true\">✓</div>" +
      "<h3 class=\"cxs-h\" tabindex=\"-1\">" + headline + "</h3>" +
      "<p class=\"cxs-sub\">Willkommen bei custix. In zwei Schritten geht es los.</p>" +
      trialNote +
      "<ol class=\"cxs-steps\">" +
      "<li><span class=\"cxs-step\">1. App herunterladen</span><div class=\"cxs-dl\">" + buttons + "</div></li>" +
      "<li><span class=\"cxs-step\">2. In der App anmelden</span>" +
      "<p class=\"cxs-note\">Öffnen Sie custix und melden Sie sich mit <strong>" + esc(email) +
      "</strong> und Ihrem Passwort an. Einen Lizenzschlüssel brauchen Sie nicht.</p></li>" +
      "</ol>" +
      "<p class=\"cxs-legal\">Eine Bestätigung mit Link zur Download-Seite ist per E-Mail unterwegs. Konto und Abo verwalten Sie auf <a href=\"" +
      api + "/konto\" target=\"_blank\" rel=\"noopener\">custix.ai/konto</a>.</p>";
    var h = box.querySelector(".cxs-h");
    if (h) h.focus();
  }

  function init() {
    injectCss();
    var root = document.getElementById("custix-signup");
    if (root) mount(root);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
