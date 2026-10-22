// 合言葉つきの確認用ページ（build.py --lock）：ページの中の暗号文を、合言葉から作った鍵で開いて表示する。
// 鍵は一度開けたらこのブラウザに残し、ほかのページは合言葉を入れ直さずに開く（合言葉が変わったら入れ直し）。
(function () {
  var SALT = "9a59ccf2695887bbd2f35595309a8f23", ITER = 400000, STORE = "key:/preview-z5hvwm/";
  var gate = document.getElementById("gate"), err = document.getElementById("err"), btn = document.getElementById("open");

  function bytes(b64) { var s = atob(b64), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
  function hex(h) { var u = new Uint8Array(h.length / 2); for (var i = 0; i < u.length; i++) u[i] = parseInt(h.substr(i * 2, 2), 16); return u; }
  // 大文字・小文字、全角・半角、空白とハイフンの違いは問わない（build.py の norm と同じ）
  function norm(s) { return s.normalize("NFKC").toLowerCase().replace(/[\s\-_.・]/g, ""); }
  function store(op, v) {
    try {
      if (op === "get") return localStorage.getItem(STORE);
      if (op === "set") localStorage.setItem(STORE, v); else localStorage.removeItem(STORE);
    } catch (e) { return null; }
  }
  async function derive(word) {
    var base = await crypto.subtle.importKey("raw", new TextEncoder().encode(norm(word)), "PBKDF2", false, ["deriveBits"]);
    return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", salt: hex(SALT), iterations: ITER, hash: "SHA-256" }, base, 256));
  }
  async function unlock(raw) {
    var data = bytes(document.getElementById("blob").textContent.trim());
    var key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
    var gz = await crypto.subtle.decrypt({ name: "AES-GCM", iv: data.slice(0, 12) }, key, data.slice(12));
    return new Response(new Blob([gz]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
  }
  function show(html) { document.open(); document.write(html); document.close(); }
  function ask(msg) {
    gate.hidden = false; err.textContent = msg || "";
    document.getElementById("gate-form").addEventListener("submit", async function (ev) {
      ev.preventDefault();
      var word = document.getElementById("pw").value, raw, html;
      if (!norm(word)) return;
      btn.disabled = true; btn.textContent = "開いています…"; err.textContent = "";
      try {
        raw = await derive(word);
        html = await unlock(raw);
      } catch (e) {
        btn.disabled = false; btn.textContent = "開く"; err.textContent = "合言葉が違います。";
        return;
      }
      store("set", btoa(String.fromCharCode.apply(null, raw)));
      show(html);
    });
  }

  if (!(window.crypto && crypto.subtle) || typeof DecompressionStream === "undefined") {
    gate.hidden = false; btn.disabled = true;
    err.textContent = "このブラウザでは開けません。新しい Safari か Chrome でお試しください。";
    return;
  }
  var saved = store("get");
  if (!saved) return ask("");
  unlock(bytes(saved)).then(show, function () { store("del"); ask("合言葉が新しくなりました。入れ直してください。"); });
})();
