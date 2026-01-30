export function createSearchState() {
  return { query: "", hits: [], activeHitIndex: -1 };
}

export function runUserNameSearch(conversationsListEl, rawQuery, state) {
  clearSearchHighlights(conversationsListEl);

  state.query = rawQuery;
  state.hits = [];
  state.activeHitIndex = -1;

  if (!rawQuery) {
    unfilterAll(conversationsListEl);
    return;
  }

  const rx = buildSearchRegex(rawQuery);
  if (!rx) {
    unfilterAll(conversationsListEl);
    return;
  }

  const nameEls = conversationsListEl.querySelectorAll(".message-item .name");

  for (const nameEl of nameEls) {
    const item = nameEl.closest(".message-item");
    if (!item) continue;

    const text = nameEl.textContent || "";

    rx.lastIndex = 0;
    const isMatch = rx.test(text);

    if (!isMatch) {
      item.classList.add("is-filtered-out");
      item.classList.remove("is-hit");
      continue;
    }

    item.classList.remove("is-filtered-out");
    item.classList.add("is-hit");

    const marks = highlightElementText(nameEl, rx);
    if (marks.length) state.hits.push(...marks);
  }

  if (state.hits.length) {
    state.activeHitIndex = 0;
    focusHit(state);
  }
}

function buildSearchRegex(input) {
  const regexMode = input.match(/^\/(.+)\/([a-z]*)$/i);

  try {
    if (regexMode) {
      const [, pattern, flags] = regexMode;
      const finalFlags = flags.includes("g") ? flags : flags + "g";
      return new RegExp(pattern, finalFlags);
    }

    const escaped = escapeRegExp(input);
    return new RegExp(escaped, "gi");
  } catch (e) {
    console.warn("Invalid search:", e);
    return null;
  }
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightElementText(el, rx) {
  const marks = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);

  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);

  for (const textNode of nodes) {
    const text = textNode.nodeValue;
    if (!text) continue;

    rx.lastIndex = 0;
    let match;
    let lastIdx = 0;

    const frag = document.createDocumentFragment();
    let didMatch = false;

    while ((match = rx.exec(text))) {
      didMatch = true;

      const start = match.index;
      const end = start + match[0].length;

      if (start > lastIdx) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx, start)));
      }

      const mark = document.createElement("mark");
      mark.className = "msg-hit";
      mark.textContent = text.slice(start, end);
      frag.appendChild(mark);
      marks.push(mark);

      lastIdx = end;

      if (match[0].length === 0) rx.lastIndex++;
    }

    if (!didMatch) continue;

    if (lastIdx < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIdx)));
    }

    textNode.parentNode.replaceChild(frag, textNode);
  }

  return marks;
}

function clearSearchHighlights(conversationsListEl) {
  const marks = conversationsListEl.querySelectorAll("mark.msg-hit");
  for (const mark of marks) {
    mark.replaceWith(document.createTextNode(mark.textContent || ""));
  }

  const nameEls = conversationsListEl.querySelectorAll(".message-item .name");
  for (const el of nameEls) el.normalize();

  const items = conversationsListEl.querySelectorAll(".message-item");
  for (const item of items) {
    item.classList.remove("is-hit");
    item.classList.remove("is-filtered-out");
  }
}

function unfilterAll(conversationsListEl) {
  const items = conversationsListEl.querySelectorAll(".message-item");
  for (const item of items) {
    item.classList.remove("is-filtered-out");
    item.classList.remove("is-hit");
  }
}

function focusHit(state) {
  const mark = state.hits[state.activeHitIndex];
  if (!mark) return;
  mark.scrollIntoView({ behavior: "smooth", block: "center" });
}
