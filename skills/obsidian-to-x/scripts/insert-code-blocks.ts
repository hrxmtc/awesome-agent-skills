import type { CdpConnection } from './x-utils.js';

interface CodeBlockInfo {
  placeholder: string;
  language: string;
  code: string;
  blockIndex: number;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Send a single Backspace keystroke via CDP.
 */
async function sendBackspace(cdp: CdpConnection, sessionId: string): Promise<void> {
  await cdp.send('Input.dispatchKeyEvent', {
    type: 'keyDown', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8,
  }, { sessionId });
  await cdp.send('Input.dispatchKeyEvent', {
    type: 'keyUp', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8,
  }, { sessionId });
}

/**
 * Delete selected text via CDP keyboard Backspace, then remove the empty block if left behind.
 *
 * Unlike execCommand('delete'), keyboard events are handled by DraftJS
 * and properly update ContentState (not just the DOM).
 *
 * Placeholders (XIMGPH_N, XCODEPH_N) each occupy an entire DraftJS block.
 * First Backspace deletes the selected text; second removes the resulting empty block
 * so no blank line remains.
 */
async function deleteViaKeyboard(cdp: CdpConnection, sessionId: string): Promise<void> {
  // 1st Backspace: delete selected text
  await sendBackspace(cdp, sessionId);
  await sleep(200);

  // Check if cursor is now on an empty DraftJS block, and whether the previous
  // sibling is an atomic block (image/embed).  A second Backspace on an empty
  // block right after an atomic block could select/delete that atomic block.
  const emptyBlockInfo = await cdp.send<{ result: { value: { empty: boolean; prevAtomic: boolean } } }>('Runtime.evaluate', {
    expression: `(() => {
      const sel = window.getSelection();
      if (!sel || !sel.focusNode) return { empty: false, prevAtomic: false };
      let node = sel.focusNode;
      if (node.nodeType === 3) node = node.parentElement;
      const block = node?.closest?.('[data-block="true"]');
      if (!block) return { empty: false, prevAtomic: false };
      const empty = (block.textContent || '').trim() === '';
      const prevBlock = block.previousElementSibling?.closest?.('[data-block="true"]')
        || block.parentElement?.previousElementSibling?.querySelector?.('[data-block="true"]');
      const prevAtomic = prevBlock?.getAttribute('contenteditable') === 'false';
      // Treat "no previous block" (first block) same as prevAtomic:
      // Backspace on the first empty block in X Articles jumps focus to the title input.
      const unsafe = !prevBlock || !!prevAtomic;
      return { empty, prevAtomic: unsafe };
    })()`,
    returnByValue: true,
  }, { sessionId });

  if (emptyBlockInfo.result.value.empty && !emptyBlockInfo.result.value.prevAtomic) {
    // 2nd Backspace: merge/remove the empty block
    // Only runs when previous block exists and is a plain text block (safe)
    await sendBackspace(cdp, sessionId);
  }
  // Skip if: first block (no prev), or prev block is atomic image/embed
}

/**
 * Helper: wait for a DOM element inside the page via MutationObserver.
 * MutationObserver is NOT throttled in background tabs, unlike setTimeout.
 * Returns true when element is found, false on timeout.
 */
async function waitForElementInPage(
  cdp: CdpConnection,
  sessionId: string,
  selectorOrExpr: string,
  timeoutMs = 15_000,
): Promise<boolean> {
  const result = await cdp.send<{ result: { value: boolean } }>('Runtime.evaluate', {
    expression: `new Promise((resolve) => {
      const expr = ${JSON.stringify(selectorOrExpr)};
      const check = () => {
        try { return eval(expr); } catch { return document.querySelector(expr); }
      };
      if (check()) { resolve(true); return; }
      const observer = new MutationObserver(() => {
        if (check()) { observer.disconnect(); clearTimeout(t); resolve(true); }
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      const t = setTimeout(() => { observer.disconnect(); resolve(false); }, ${timeoutMs});
    })`,
    awaitPromise: true,
    returnByValue: true,
  }, { sessionId, timeoutMs: timeoutMs + 5_000 });
  return result.result.value === true;
}

/**
 * 在 X Articles 编辑器中插入单个代码块
 *
 * 混合方案: MutationObserver 等待 DOM（不受后台节流影响）+ CDP Input 方法输入文本（React 需要真正的浏览器级输入）
 */
async function insertSingleCodeBlock(
  cdp: CdpConnection,
  sessionId: string,
  language: string,
  code: string,
): Promise<boolean> {
  const capitalizedLanguage = language.charAt(0).toUpperCase() + language.slice(1).toLowerCase();

  try {
    // 1. Click "Add Media" → wait for menu via MutationObserver
    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('button[aria-label="Add Media"]')?.click()`,
    }, { sessionId });

    const menuFound = await waitForElementInPage(cdp, sessionId, '[role="menuitem"]');
    if (!menuFound) { console.warn('[insert-code-block] Menu did not appear'); return false; }

    // 2. Click "Code" → wait for language input via MutationObserver
    await cdp.send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll('[role="menuitem"]')).find(el => el.textContent.trim() === 'Code')?.click()`,
    }, { sessionId });

    const inputFound = await waitForElementInPage(cdp, sessionId, 'input');
    if (!inputFound) { console.warn('[insert-code-block] Language input did not appear'); return false; }

    // 3. Focus input + type language via CDP (React needs real browser-level input)
    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('input')?.focus()`,
    }, { sessionId });
    await sleep(100);
    await cdp.send('Input.insertText', { text: capitalizedLanguage }, { sessionId });
    await sleep(300);

    // 4. ArrowDown + Enter to select autocomplete option (CDP keyboard)
    for (const key of [
      { key: 'ArrowDown', code: 'ArrowDown', vk: 40 },
      { key: 'Enter', code: 'Enter', vk: 13 },
    ]) {
      await cdp.send('Input.dispatchKeyEvent', {
        type: 'keyDown', key: key.key, code: key.code, windowsVirtualKeyCode: key.vk,
      }, { sessionId });
      await cdp.send('Input.dispatchKeyEvent', {
        type: 'keyUp', key: key.key, code: key.code, windowsVirtualKeyCode: key.vk,
      }, { sessionId });
    }

    // 5. Wait for textarea → focus → type code via CDP
    const textareaFound = await waitForElementInPage(cdp, sessionId, 'textarea');
    if (!textareaFound) { console.warn('[insert-code-block] Code textarea did not appear'); return false; }

    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('textarea')?.focus()`,
    }, { sessionId });
    await sleep(100);
    await cdp.send('Input.insertText', { text: code }, { sessionId });
    await sleep(200);

    // 6. Wait for Insert button → click → wait for dialog to close
    const insertBtnFound = await waitForElementInPage(cdp, sessionId,
      `Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.trim() === 'Insert')`,
    );
    if (!insertBtnFound) { console.warn('[insert-code-block] Insert button not found'); return false; }

    await cdp.send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.trim() === 'Insert')?.click()`,
    }, { sessionId });

    // Wait for DraftJS to re-render (dialog closes, editor updates)
    await sleep(500);

    return true;
  } catch (e) {
    console.warn('[insert-code-block] Error:', e instanceof Error ? e.message : String(e));
    return false;
  }
}

/**
 * 插入所有代码块（替换占位符）
 */
export async function insertCodeBlocks(
  cdp: CdpConnection,
  sessionId: string,
  codeBlocks: CodeBlockInfo[],
): Promise<void> {
  if (codeBlocks.length === 0) {
    return;
  }

  console.log(`[insert-code] Inserting ${codeBlocks.length} code blocks...`);

  // 检查编辑器中的占位符
  const editorContent = await cdp.send<{ result: { value: string } }>('Runtime.evaluate', {
    expression: `document.querySelector('.DraftEditor-editorContainer [data-contents="true"]')?.innerText || ''`,
    returnByValue: true,
  }, { sessionId });

  console.log('[insert-code] Checking for code placeholders in content...');
  for (const block of codeBlocks) {
    const regex = new RegExp(block.placeholder + '(?!\\d)');
    if (regex.test(editorContent.result.value)) {
      console.log(`[insert-code] Found: ${block.placeholder}`);
    } else {
      console.log(`[insert-code] NOT found: ${block.placeholder}`);
    }
  }

  // 按占位符顺序处理代码块
  const getPlaceholderIndex = (placeholder: string): number => {
    const match = placeholder.match(/XCODEPH_(\d+)/);
    return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
  };
  const sortedCodeBlocks = [...codeBlocks].sort(
    (a, b) => getPlaceholderIndex(a.placeholder) - getPlaceholderIndex(b.placeholder),
  );

  for (let i = 0; i < sortedCodeBlocks.length; i++) {
    const block = sortedCodeBlocks[i]!;
    console.log(`[insert-code] [${i + 1}/${sortedCodeBlocks.length}] Inserting code at placeholder: ${block.placeholder}`);

    // 选择占位符
    const selectPlaceholder = async (maxRetries = 3): Promise<boolean> => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        await cdp.send('Runtime.evaluate', {
          expression: `(() => {
            const editor = document.querySelector('.DraftEditor-editorContainer [data-contents="true"]');
            if (!editor) return false;

            const placeholder = ${JSON.stringify(block.placeholder)};
            const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null, false);
            let node;

            while ((node = walker.nextNode())) {
              const text = node.textContent || '';
              let searchStart = 0;
              let idx;

              while ((idx = text.indexOf(placeholder, searchStart)) !== -1) {
                const afterIdx = idx + placeholder.length;
                const charAfter = text[afterIdx];

                if (charAfter === undefined || !/\\d/.test(charAfter)) {
                  const parentElement = node.parentElement;
                  if (parentElement) {
                    parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }

                  const range = document.createRange();
                  range.setStart(node, idx);
                  range.setEnd(node, idx + placeholder.length);
                  const sel = window.getSelection();
                  sel.removeAllRanges();
                  sel.addRange(range);
                  return true;
                }
                searchStart = afterIdx;
              }
            }
            return false;
          })()`,
        }, { sessionId });

        await sleep(800); // Wait for scroll + selection to settle

        // 验证选择
        const selectionCheck = await cdp.send<{ result: { value: string } }>('Runtime.evaluate', {
          expression: `window.getSelection()?.toString() || ''`,
          returnByValue: true,
        }, { sessionId });

        const selectedText = selectionCheck.result.value.trim();
        if (selectedText === block.placeholder) {
          console.log(`[insert-code] Selection verified: "${selectedText}"`);
          return true;
        }

        if (attempt < maxRetries) {
          console.log(`[insert-code] Selection attempt ${attempt} got "${selectedText}", retrying...`);
          await sleep(1000); // Longer retry delay for background tabs
        } else {
          console.warn(`[insert-code] Selection failed after ${maxRetries} attempts, got: "${selectedText}"`);
        }
      }
      return false;
    };

    const selected = await selectPlaceholder(5);
    if (!selected) {
      console.warn(`[insert-code] Skipping code block - could not select placeholder: ${block.placeholder}`);
      continue;
    }

    console.log(`[insert-code] Inserting ${block.language} code (${block.code.length} chars)`);

    // Focus editor to ensure DraftJS is aware of selection and subsequent edits
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const editor = document.querySelector('.DraftEditor-editorContainer [contenteditable="true"]');
        if (editor) editor.focus();
      })()`,
    }, { sessionId });
    await sleep(300);

    // 删除占位符（使用 CDP 键盘 Backspace，DraftJS 会正确更新 ContentState）
    // 注意：execCommand('delete') 只改 DOM 不改 ContentState，DraftJS 重新渲染后占位符会复活
    console.log(`[insert-code] Deleting placeholder...`);
    await deleteViaKeyboard(cdp, sessionId);

    await sleep(500);

    // 验证占位符已删除
    const afterDelete = await cdp.send<{ result: { value: boolean } }>('Runtime.evaluate', {
      expression: `(() => {
        const editor = document.querySelector('.DraftEditor-editorContainer [data-contents="true"]');
        if (!editor) return true;
        const text = editor.innerText;
        const placeholder = ${JSON.stringify(block.placeholder)};
        const regex = new RegExp(placeholder + '(?!\\\\d)');
        return !regex.test(text);
      })()`,
      returnByValue: true,
    }, { sessionId });

    if (!afterDelete.result.value) {
      console.warn(`[insert-code] Placeholder still exists, retrying deletion...`);
      // 重试：重新选择并使用多种方法删除
      const reselected = await selectPlaceholder(2);
      if (reselected) {
        await sleep(300);
        // 使用 CDP 键盘 Backspace 重试删除（确保更新 ContentState）
        await deleteViaKeyboard(cdp, sessionId);
        await sleep(800);

        // 再次验证
        const finalCheck = await cdp.send<{ result: { value: boolean } }>('Runtime.evaluate', {
          expression: `(() => {
            const editor = document.querySelector('.DraftEditor-editorContainer [data-contents="true"]');
            if (!editor) return true;
            const text = editor.innerText;
            const placeholder = ${JSON.stringify(block.placeholder)};
            const regex = new RegExp(placeholder + '(?!\\\\\\\\d)');
            return !regex.test(text);
          })()`,
          returnByValue: true,
        }, { sessionId });

        if (!finalCheck.result.value) {
          console.error(`[insert-code] ❌ Failed to delete placeholder after retry: ${block.placeholder}`);
          console.error(`[insert-code] Skipping this code block to avoid duplication`);
          continue;
        } else {
          console.log(`[insert-code] ✓ Placeholder deleted successfully on retry`);
        }
      } else {
        console.error(`[insert-code] ❌ Could not reselect placeholder, skipping: ${block.placeholder}`);
        continue;
      }
    }

    // CRITICAL: Ensure editor has focus before opening "Add Media" dialog.
    // After deleteViaKeyboard(), cursor might be on an empty block. DraftJS needs
    // the editor to be focused when "Add Media" is clicked to record the insertion point.
    // Without this, the code block may be inserted at the wrong position (e.g., title).
    console.log(`[insert-code] Ensuring editor focus before code block insertion...`);
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const editor = document.querySelector('.DraftEditor-editorContainer [contenteditable="true"]');
        if (editor) {
          editor.focus();
          // If cursor is on an empty block, move to start of block to ensure position is recorded
          const sel = window.getSelection();
          if (sel && sel.focusNode) {
            let node = sel.focusNode;
            if (node.nodeType === 3) node = node.parentElement;
            const block = node?.closest?.('[data-block="true"]');
            if (block && (block.textContent || '').trim() === '') {
              // Empty block: collapse selection to start to ensure DraftJS knows the position
              sel.collapseToStart();
            }
          }
        }
      })()`,
    }, { sessionId });
    await sleep(300);

    // 插入代码块
    const insertOk = await insertSingleCodeBlock(cdp, sessionId, block.language, block.code);

    if (insertOk) {
      console.log(`[insert-code] Code block ${i + 1}/${sortedCodeBlocks.length} inserted`);
    } else {
      console.warn(`[insert-code] Code block ${i + 1}/${sortedCodeBlocks.length} insertion may have failed`);
    }

    // 验证：占位符应消失（确认代码块真正替换了占位符）
    await sleep(300);
    const postInsertCheck = await cdp.send<{ result: { value: boolean } }>('Runtime.evaluate', {
      expression: `(() => {
        const editor = document.querySelector('.DraftEditor-editorContainer [data-contents="true"]');
        if (!editor) return true;
        const text = editor.innerText;
        const placeholder = ${JSON.stringify(block.placeholder)};
        const regex = new RegExp(placeholder + '(?!\\\\d)');
        return !regex.test(text);
      })()`,
      returnByValue: true,
    }, { sessionId });

    if (!postInsertCheck.result.value) {
      console.warn(`[insert-code] ⚠ Placeholder "${block.placeholder}" still present after insert, retrying...`);
      // 重试一次：重新选择 → 键盘删除 → 重新插入
      const resel = await selectPlaceholder(3);
      if (resel) {
        await cdp.send('Runtime.evaluate', {
          expression: `(() => {
            const editor = document.querySelector('.DraftEditor-editorContainer [contenteditable="true"]');
            if (editor) editor.focus();
          })()`,
        }, { sessionId });
        await sleep(300);
        await deleteViaKeyboard(cdp, sessionId);
        await sleep(500);
        const retryOk = await insertSingleCodeBlock(cdp, sessionId, block.language, block.code);
        if (retryOk) {
          console.log(`[insert-code] ✓ Code block ${i + 1}/${sortedCodeBlocks.length} inserted on retry`);
        } else {
          console.warn(`[insert-code] ❌ Code block ${i + 1}/${sortedCodeBlocks.length} retry also failed`);
        }
      } else {
        console.warn(`[insert-code] ❌ Could not reselect placeholder for retry: ${block.placeholder}`);
      }
    }

    // Brief pause to let DraftJS stabilize before next placeholder search
    await sleep(500);
  }

  console.log('[insert-code] All code blocks inserted successfully');
}
