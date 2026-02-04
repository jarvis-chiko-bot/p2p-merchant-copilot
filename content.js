(function() {
  'use strict';

  let widget = null;
  let isMinimized = false;
  let currentTemplates = [];
  let defaultFee = 1;

  // Track last focused editable element so clicking the widget doesn't steal focus
  let lastFocusedEditable = null;

  const defaultTemplates = [
    { id: 1, text: "Hola! ¿Me confirmás si el pago es por {banco}? Apenas lo vea reflejado, libero el USDT." },
    { id: 2, text: "Perfecto. Porfa realizá el pago y enviame el comprobante. En cuanto lo confirme, libero." },
    { id: 3, text: "Pago recibido. Estoy liberando el USDT ahora. Avisame si ya te aparece." },
    { id: 4, text: "Si tu banco te pone retención, avisame y te doy {minutos} minutos extra." },
    { id: 5, text: "Gracias por la compra. Si todo salió bien, ¿me dejás un review de 5 estrellas?" }
  ];

  function init() {
    if (document.getElementById('p2p-copilot-widget')) return;
    
    loadSettings().then(() => {
      createWidget();
      setupDragAndResize();
      setupCalculator();
      setupTemplates();
      setupToast();
      setupFocusTracking();
    });
  }

  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['templates', 'defaultFee']);
      currentTemplates = result.templates || [...defaultTemplates];
      defaultFee = result.defaultFee || 1;
    } catch (e) {
      currentTemplates = [...defaultTemplates];
      defaultFee = 1;
    }
  }

  function createWidget() {
    widget = document.createElement('div');
    widget.id = 'p2p-copilot-widget';
    widget.className = 'p2p-copilot-widget';
    
    widget.innerHTML = `
      <div class="p2p-copilot-header">
        <h3>P2P Copilot</h3>
        <div class="p2p-copilot-controls">
          <button class="p2p-copilot-btn" id="p2p-copilot-minimize" title="Minimize">−</button>
          <button class="p2p-copilot-btn" id="p2p-copilot-close" title="Close">×</button>
        </div>
      </div>
      <div class="p2p-copilot-body">
        <div class="p2p-copilot-tabs">
          <button class="p2p-copilot-tab active" data-tab="calculator">Calculator</button>
          <button class="p2p-copilot-tab" data-tab="templates">Templates</button>
        </div>
        
        <div class="p2p-copilot-tab-content active" id="tab-calculator">
          <div class="p2p-copilot-section">
            <div class="p2p-copilot-form-row">
              <div class="p2p-copilot-form-group">
                <label>Buy Price</label>
                <input type="number" id="buy-price" placeholder="0.00" step="0.01">
              </div>
              <div class="p2p-copilot-form-group">
                <label>Sell Price</label>
                <input type="number" id="sell-price" placeholder="0.00" step="0.01">
              </div>
            </div>
            <div class="p2p-copilot-form-row">
              <div class="p2p-copilot-form-group">
                <label>Amount</label>
                <input type="number" id="amount" placeholder="0.00" step="0.0001">
              </div>
              <div class="p2p-copilot-form-group">
                <label>Fee (%)</label>
                <input type="number" id="fee-percent" placeholder="1.0" step="0.01" value="${defaultFee}">
              </div>
            </div>
            <div class="p2p-copilot-results">
              <div class="p2p-copilot-result-item">
                <span class="p2p-copilot-result-label">Gross Profit</span>
                <span class="p2p-copilot-result-value" id="gross-profit">0.00</span>
              </div>
              <div class="p2p-copilot-result-item">
                <span class="p2p-copilot-result-label">Fee Amount</span>
                <span class="p2p-copilot-result-value" id="fee-amount">0.00</span>
              </div>
              <div class="p2p-copilot-result-item">
                <span class="p2p-copilot-result-label">Net Profit</span>
                <span class="p2p-copilot-result-value" id="net-profit">0.00</span>
              </div>
              <div class="p2p-copilot-result-item">
                <span class="p2p-copilot-result-label">Margin</span>
                <span class="p2p-copilot-result-value" id="margin-percent">0.00%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="p2p-copilot-tab-content" id="tab-templates">
          <div class="p2p-copilot-section">
            <div class="p2p-copilot-vars" id="p2p-copilot-vars">
              <span class="p2p-copilot-vars-label">Vars</span>
              <button class="p2p-copilot-chip" data-var="{monto}" type="button">{monto}</button>
              <button class="p2p-copilot-chip" data-var="{banco}" type="button">{banco}</button>
              <button class="p2p-copilot-chip" data-var="{minutos}" type="button">{minutos}</button>
              <button class="p2p-copilot-chip" data-var="{ref}" type="button">{ref}</button>
            </div>
            <div class="p2p-copilot-templates-list" id="templates-list">
              <!-- Templates will be populated here -->
            </div>
          </div>
        </div>
      </div>
      <div class="p2p-copilot-resize-handle"></div>
    `;
    
    document.body.appendChild(widget);
    
    document.getElementById('p2p-copilot-close').addEventListener('click', () => {
      widget.style.display = 'none';
    });
    
    document.getElementById('p2p-copilot-minimize').addEventListener('click', toggleMinimize);
    
    setupTabs();
    setupKeyboardShortcuts();
  }

  function setupTabs() {
    const tabs = widget.querySelectorAll('.p2p-copilot-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.dataset.tab;
        
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        widget.querySelectorAll('.p2p-copilot-tab-content').forEach(content => {
          content.classList.remove('active');
        });
        document.getElementById(`tab-${targetId}`).classList.add('active');
      });
    });
  }

  function toggleMinimize() {
    isMinimized = !isMinimized;
    widget.classList.toggle('minimized', isMinimized);
    const btn = document.getElementById('p2p-copilot-minimize');
    btn.textContent = isMinimized ? '+' : '−';
    btn.title = isMinimized ? 'Expand' : 'Minimize';
  }

  function setupDragAndResize() {
    const header = widget.querySelector('.p2p-copilot-header');
    const resizeHandle = widget.querySelector('.p2p-copilot-resize-handle');
    
    let isDragging = false;
    let isResizing = false;
    let startX, startY, startLeft, startTop, startWidth, startHeight;
    
    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('.p2p-copilot-btn')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = widget.offsetLeft;
      startTop = widget.offsetTop;
      widget.style.cursor = 'grabbing';
    });
    
    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = widget.offsetWidth;
      startHeight = widget.offsetHeight;
      e.stopPropagation();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        widget.style.left = `${startLeft + dx}px`;
        widget.style.top = `${startTop + dy}px`;
        widget.style.right = 'auto';
      } else if (isResizing) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        widget.style.width = `${Math.max(280, startWidth + dx)}px`;
        widget.style.height = `${Math.max(200, startHeight + dy)}px`;
      }
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
      isResizing = false;
      widget.style.cursor = 'default';
    });
  }

  function setupCalculator() {
    const inputs = ['buy-price', 'sell-price', 'amount', 'fee-percent'];
    
    inputs.forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('input', calculateProfit);
      }
    });
  }

  function calculateProfit() {
    const buyPrice = parseFloat(document.getElementById('buy-price').value) || 0;
    const sellPrice = parseFloat(document.getElementById('sell-price').value) || 0;
    const amount = parseFloat(document.getElementById('amount').value) || 0;
    const feePercent = parseFloat(document.getElementById('fee-percent').value) || 0;
    
    const grossProfit = (sellPrice - buyPrice) * amount;
    const feeAmount = grossProfit * (feePercent / 100);
    const netProfit = grossProfit - feeAmount;
    const margin = buyPrice > 0 ? ((sellPrice - buyPrice) / buyPrice) * 100 : 0;
    
    document.getElementById('gross-profit').textContent = grossProfit.toFixed(2);
    document.getElementById('fee-amount').textContent = feeAmount.toFixed(2);
    document.getElementById('net-profit').textContent = netProfit.toFixed(2);
    document.getElementById('margin-percent').textContent = margin.toFixed(2) + '%';
    
    const netProfitEl = document.getElementById('net-profit');
    netProfitEl.className = 'p2p-copilot-result-value ' + (netProfit >= 0 ? 'positive' : 'negative');
  }

  function setupTemplates() {
    renderTemplates();
    setupVariableChips();
  }

  function setupVariableChips() {
    const container = document.getElementById('p2p-copilot-vars');
    if (!container) return;

    container.querySelectorAll('button[data-var]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const v = btn.getAttribute('data-var');
        if (v) pasteIntoFocusedInput(v);
      });
    });
  }

  function renderTemplates() {
    const container = document.getElementById('templates-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    currentTemplates.forEach((template, index) => {
      const item = document.createElement('div');
      item.className = 'p2p-copilot-template-item';
      item.innerHTML = `
        <span class="p2p-copilot-template-text">${escapeHtml(template.text)}</span>
        <div class="p2p-copilot-template-actions">
          <button class="p2p-copilot-btn-small" data-action="copy" data-index="${index}">Copy</button>
          <button class="p2p-copilot-btn-small secondary" data-action="paste" data-index="${index}">Paste</button>
        </div>
      `;
      container.appendChild(item);
    });
    
    container.querySelectorAll('button[data-action="copy"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        copyToClipboard(currentTemplates[index].text);
      });
    });
    
    container.querySelectorAll('button[data-action="paste"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        pasteIntoFocusedInput(currentTemplates[index].text);
      });
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard!');
    }).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast('Copied to clipboard!');
    });
  }

  function setupFocusTracking() {
    // Capture focus changes to remember the last editable element
    document.addEventListener('focusin', (e) => {
      const el = e.target;
      if (!el) return;
      // Ignore focus inside our widget
      if (widget && widget.contains(el)) return;
      if (isEditable(el)) {
        lastFocusedEditable = el;
      }
    }, true);
  }

  function isEditable(el) {
    if (!el) return false;
    if (el.isContentEditable) return true;
    const tag = (el.tagName || '').toUpperCase();
    if (tag === 'TEXTAREA') return !el.disabled && !el.readOnly;
    if (tag === 'INPUT') {
      const type = (el.getAttribute('type') || 'text').toLowerCase();
      const disallowed = ['button', 'submit', 'checkbox', 'radio', 'file', 'range', 'color', 'hidden'];
      if (disallowed.includes(type)) return false;
      return !el.disabled && !el.readOnly;
    }
    // Some sites use ARIA textbox on a div
    if (el.getAttribute && el.getAttribute('role') === 'textbox') return true;
    return false;
  }

  function isVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    const style = window.getComputedStyle(el);
    return style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0';
  }

  function isBinance() {
    return /(^|\.)binance\.com$/i.test(window.location.hostname);
  }

  function findBinanceChatInput() {
    // Heuristic scan: prefer visible textareas/contenteditable elements that look like a chat box
    const candidates = [];
    const all = Array.from(document.querySelectorAll('textarea, input, [contenteditable="true"], [role="textbox"]'));

    for (const el of all) {
      if (!isEditable(el)) continue;
      if (!isVisible(el)) continue;

      let score = 0;
      const placeholder = (el.getAttribute('placeholder') || '').toLowerCase();
      const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
      const name = (el.getAttribute('name') || '').toLowerCase();
      const id = (el.id || '').toLowerCase();
      const cls = (el.className || '').toString().toLowerCase();

      const attrBlob = `${placeholder} ${ariaLabel} ${name} ${id} ${cls}`;
      const parentBlob = (el.closest('[class],[id]') ? ((el.closest('[class],[id]').className || '') + ' ' + (el.closest('[class],[id]').id || '')).toLowerCase() : '');

      // Strong signals
      if (/(chat|message|messaging|inbox|conversation)/.test(attrBlob)) score += 6;
      if (/(type|write|send)\s+(a\s+)?(message|msg)/.test(attrBlob)) score += 6;
      if (/(mensaje|escrib)/.test(attrBlob)) score += 5;

      // Parent/container signals
      if (/(chat|message|conversation|order)/.test(parentBlob)) score += 3;

      // Prefer multi-line inputs
      const tag = (el.tagName || '').toUpperCase();
      if (tag === 'TEXTAREA') score += 2;
      if (el.isContentEditable) score += 2;

      // Penalize search boxes
      if (/(search|buscar)/.test(attrBlob)) score -= 10;

      // Binance P2P pages often have a single prominent textbox; require positive score
      if (score > 0) {
        candidates.push({ el, score });
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates.length ? candidates[0].el : null;
  }

  function insertTextInto(el, text) {
    if (!el) return false;

    try {
      el.focus({ preventScroll: true });
    } catch {
      try { el.focus(); } catch {}
    }

    if (el.isContentEditable) {
      try {
        document.execCommand('insertText', false, text);
      } catch {
        // Fallback: append
        el.textContent = (el.textContent || '') + text;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }

    const tag = (el.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      // Prefer setRangeText to preserve selection
      if (typeof el.setRangeText === 'function') {
        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? el.value.length;
        el.setRangeText(text, start, end, 'end');
      } else {
        const start = el.selectionStart || 0;
        const end = el.selectionEnd || 0;
        const value = el.value || '';
        el.value = value.substring(0, start) + text + value.substring(end);
        el.selectionStart = el.selectionEnd = start + text.length;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    // ARIA textbox div fallback
    if (el.getAttribute && el.getAttribute('role') === 'textbox') {
      try {
        document.execCommand('insertText', false, text);
      } catch {
        el.textContent = (el.textContent || '') + text;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }

    return false;
  }

  function resolvePasteTarget() {
    const active = document.activeElement;
    if (active && ! (widget && widget.contains(active)) && isEditable(active)) return active;

    if (lastFocusedEditable && document.contains(lastFocusedEditable) && isEditable(lastFocusedEditable)) {
      return lastFocusedEditable;
    }

    if (isBinance()) {
      const binanceInput = findBinanceChatInput();
      if (binanceInput) return binanceInput;
    }

    return null;
  }

  function pasteIntoFocusedInput(text) {
    const target = resolvePasteTarget();

    if (target) {
      const ok = insertTextInto(target, text);
      if (ok) {
        showToast(isBinance() ? 'Pasted into Binance chat!' : 'Pasted into input!');
        return;
      }
    }

    copyToClipboard(text);
    showToast('No input found. Copied instead!');
  }

  function setupToast() {
    if (document.getElementById('p2p-copilot-toast')) return;
    
    const toast = document.createElement('div');
    toast.id = 'p2p-copilot-toast';
    toast.className = 'p2p-copilot-toast';
    document.body.appendChild(toast);
  }

  function showToast(message) {
    const toast = document.getElementById('p2p-copilot-toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }

  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        if (widget.style.display === 'none') {
          widget.style.display = 'block';
        } else {
          toggleMinimize();
        }
      }
      
      if (e.ctrlKey && e.shiftKey && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (currentTemplates[index]) {
          pasteIntoFocusedInput(currentTemplates[index].text);
        }
      }
    });
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'showWidget') {
      if (!widget) {
        init();
      } else {
        widget.style.display = 'block';
      }
      sendResponse({ success: true });
    }
    return true;
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
