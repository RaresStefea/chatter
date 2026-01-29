function applyBlur(open) {
  document.body.classList.toggle("modal-open", open);
}

function lockDialogForLogin(dialogEl) {
  dialogEl.addEventListener("cancel", (e) => e.preventDefault());
  dialogEl.addEventListener("click", (e) => {
    const rect = dialogEl.getBoundingClientRect();
    const inside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    if (!inside) e.preventDefault();
  });
}

function allowDialogClose(dialogEl, onCancel) {
  dialogEl.addEventListener(
    "close",
    () => {
      if (dialogEl.returnValue !== "ok") onCancel?.();
    },
    { once: true }
  );
}

export async function getUserIdFromModal() {
  const dialog = document.querySelector("#loginDialog");
  const input = document.querySelector("#loginInput");
  const form = document.querySelector("#loginForm");

  if (!dialog || !input || !form) throw new Error("Login modal elements not found");

  lockDialogForLogin(dialog);        
  applyBlur(true);
  dialog.showModal();
  input.value = "";
  input.focus();

  return await new Promise((resolve) => {
    form.addEventListener(
      "submit",
      (e) => {
        e.preventDefault();
        const userId = input.value.trim();
        if (!userId) {
          input.reportValidity?.();
          input.focus();
          return;
        }
        dialog.close("ok");
        applyBlur(false);
        resolve({ userId });
      },
      { once: true }
    );
  });
}

export async function promptForFriendIdModal() {
  const dialog = document.querySelector("#addFriendDialog");
  const input = document.querySelector("#friendInput");
  const form = document.querySelector("#addFriendForm");

  if (!dialog || !input || !form) throw new Error("Add friend modal elements not found");
  let resolved = false;
  const resolveOnce = (val, resolve) => {
    if (resolved) return;
    resolved = true;
    resolve(val);
  };

  applyBlur(true);
  dialog.showModal();
  input.value = "";
  input.focus();

  return await new Promise((resolve) => {
    allowDialogClose(dialog, () => {
      applyBlur(false);
      resolveOnce(null, resolve);
    });

    form.addEventListener(
      "submit",
      (e) => {
        e.preventDefault();
        const peerId = input.value.trim();
        if (!peerId) {
          dialog.close("cancel");
          applyBlur(false);
          resolveOnce(null, resolve);
          return;
        }

        dialog.close("ok");
        applyBlur(false);
        resolveOnce({ peerId }, resolve);
      },
      { once: true }
    );

    const cancelBtn = document.getElementById("friendCancelBtn");
    if (cancelBtn) {
      cancelBtn.addEventListener(
        "click",
        () => {
        },
        { once: true }
      );
    }
  });
}