document.addEventListener('DOMContentLoaded', () => {
  const defaultTemplates = [
    { id: 1, text: "Hi! I can help you with this trade. What's your preferred payment method?" },
    { id: 2, text: "Thanks for your order! Please send the payment and I'll release the crypto right away." },
    { id: 3, text: "I've received your payment. Releasing the crypto now, please confirm once received." },
    { id: 4, text: "Hello! I'm online and ready to trade. Do you have any questions?" },
    { id: 5, text: "Thank you for trading with me! Please leave a positive review if everything went well." }
  ];

  let currentTemplates = [];
  let currentFee = 1;

  const feeInput = document.getElementById('default-fee');
  const templatesContainer = document.getElementById('templates-container');
  const saveBtn = document.getElementById('save-btn');
  const resetBtn = document.getElementById('reset-btn');
  const statusMessage = document.getElementById('status-message');

  function loadSettings() {
    chrome.storage.sync.get(['templates', 'defaultFee'], (result) => {
      currentTemplates = result.templates || [...defaultTemplates];
      currentFee = result.defaultFee || 1;
      
      feeInput.value = currentFee;
      renderTemplates();
    });
  }

  function renderTemplates() {
    templatesContainer.innerHTML = '';
    
    currentTemplates.forEach((template, index) => {
      const item = document.createElement('div');
      item.className = 'template-item';
      item.innerHTML = `
        <div class="template-header">
          <span class="template-number">Template ${index + 1}</span>
          <span class="template-shortcut">Ctrl+Shift+${index + 1}</span>
        </div>
        <textarea 
          data-index="${index}" 
          placeholder="Enter your message template..."
        >${escapeHtml(template.text)}</textarea>
      `;
      templatesContainer.appendChild(item);
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function saveSettings() {
    const fee = parseFloat(feeInput.value) || 1;
    const templates = [];
    
    templatesContainer.querySelectorAll('textarea').forEach((textarea, index) => {
      templates.push({
        id: index + 1,
        text: textarea.value.trim() || defaultTemplates[index].text
      });
    });
    
    chrome.storage.sync.set({
      templates: templates,
      defaultFee: fee
    }, () => {
      showStatus('Settings saved successfully!', 'success');
    });
  }

  function resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      currentTemplates = [...defaultTemplates];
      currentFee = 1;
      
      feeInput.value = currentFee;
      renderTemplates();
      
      chrome.storage.sync.set({
        templates: defaultTemplates,
        defaultFee: 1
      }, () => {
        showStatus('Settings reset to defaults!', 'success');
      });
    }
  }

  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type} show`;
    
    setTimeout(() => {
      statusMessage.classList.remove('show');
    }, 3000);
  }

  saveBtn.addEventListener('click', saveSettings);
  resetBtn.addEventListener('click', resetToDefaults);
  
  loadSettings();
});
