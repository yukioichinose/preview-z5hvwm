// メニュー（スマホ）と、論考・寄稿の絞り込み
(function () {
  var drawer = document.getElementById("drawer");
  var openBtn = document.querySelector(".site-head .menu-btn");
  function setOpen(open) {
    drawer.classList.toggle("open", open);
    openBtn.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
    (open ? drawer.querySelector("[data-close]") : openBtn).focus();
  }
  if (drawer && openBtn) {
    openBtn.addEventListener("click", function () { setOpen(true); });
    drawer.querySelector("[data-close]").addEventListener("click", function () { setOpen(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("open")) setOpen(false); });
  }

  var q = document.getElementById("q"), g = document.getElementById("g"), y = document.getElementById("y");
  if (!q) return;
  // カタカナとひらがな、全角と半角を区別しない
  function fold(s) {
    return s.normalize("NFKC").toLowerCase().replace(/[ァ-ヶ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0x60); });
  }
  var items = Array.prototype.slice.call(document.querySelectorAll("#wl li[data-k]"));
  items.forEach(function (li) { li._k = fold(li.getAttribute("data-k")); });
  var heads = document.querySelectorAll("#wl .year-head"), lists = document.querySelectorAll("#wl ul.wlist");
  var count = document.getElementById("count"), empty = document.getElementById("empty");
  function apply() {
    var words = fold(q.value).split(/\s+/).filter(Boolean), gv = g.value, yv = y.value, n = 0, per = {};
    items.forEach(function (li) {
      var ok = (!gv || li.getAttribute("data-g") === gv) && (!yv || li.getAttribute("data-y") === yv) &&
        words.every(function (w) { return li._k.indexOf(w) >= 0; });
      li.hidden = !ok;
      if (ok) { n++; per[li.getAttribute("data-y")] = (per[li.getAttribute("data-y")] || 0) + 1; }
    });
    for (var i = 0; i < heads.length; i++) {
      var yr = heads[i].getAttribute("data-year"), c = per[yr] || 0;
      heads[i].hidden = !c; lists[i].hidden = !c;
      heads[i].querySelector("span").textContent = c + " 件";
    }
    count.textContent = n + " 件";
    empty.hidden = n > 0;
    var p = new URLSearchParams();
    if (q.value) p.set("q", q.value);
    if (gv) p.set("media", gv);
    if (yv) p.set("year", yv);
    history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : ""));
  }
  var p = new URLSearchParams(location.search);
  q.value = p.get("q") || ""; g.value = p.get("media") || ""; y.value = p.get("year") || "";
  q.addEventListener("input", apply); g.addEventListener("change", apply); y.addEventListener("change", apply);
  if (q.value || g.value || y.value) apply();
})();
