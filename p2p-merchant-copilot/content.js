(function() {
  'use strict';

  let widget = null;
  let isMinimized = false;
  let currentTemplates = [];
  let defaultFee = 1;

  const defaultTemplates = [
    { id: 1, text: "Hi! I can help you with this trade. What's your preferred payment method?" },
    { id: 2, text: "Thanks for your order! Please send the payment and I'll release the crypto right away." },
    { id: 3, text: "I've received your payment. Releasing the crypto now, please confirm once received." },
    { id: 4, text: "Hello! I'm online and ready to trade. Do you have any questions?" },
    { id: 5, text: "Thank you for trading with me! Please leave a positive review if everything went well." }
  ];

  function init() {
    if (document.getElementById('p2p-copilot-widget')) return;
    
    loadSettings().then(() => {
      createWidget();
      setupDragAndResize();
      setupCalculator();
      setupTemplates();
      setupToast();
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

  function pasteIntoFocusedInput(text) {
    const activeElement = document.activeElement;
    
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)) {
      if (activeElement.isContentEditable) {
        document.execCommand('insertText', false, text);
      } else {
        const start = activeElement.selectionStart || 0;
        const end = activeElement.selectionEnd || 0;
        const value = activeElement.value;
        activeElement.value = value.substring(0, start) + text + value.substring(end);
        activeElement.selectionStart = activeElement.selectionEnd = start + text.length;
      }
      activeElement.dispatchEvent(new Event('input', { bubbles: true }));
      showToast('Pasted into input!');
    } else {
      copyToClipboard(text);
      showToast('No input focused. Copied instead!');
    }
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
