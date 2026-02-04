document.addEventListener('DOMContentLoaded', () => {
  const defaultTemplates = [
    { id: 1, text: "Hola! ¿Me confirmás si el pago es por {banco}? Apenas lo vea reflejado, libero el USDT." },
    { id: 2, text: "Perfecto. Porfa realizá el pago y enviame el comprobante. En cuanto lo confirme, libero." },
    { id: 3, text: "Pago recibido. Estoy liberando el USDT ahora. Avisame si ya te aparece." },
    { id: 4, text: "Si tu banco te pone retención, avisame y te doy {minutos} minutos extra." },
    { id: 5, text: "Gracias por la compra. Si todo salió bien, ¿me dejás un review de 5 estrellas?" }
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
