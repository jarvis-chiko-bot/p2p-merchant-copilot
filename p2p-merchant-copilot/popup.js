document.addEventListener('DOMContentLoaded', () => {
  const showWidgetBtn = document.getElementById('show-widget');
  const openSettingsBtn = document.getElementById('open-settings');
  const statusDiv = document.getElementById('status');

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type} show`;
    
    setTimeout(() => {
      statusDiv.classList.remove('show');
    }, 2000);
  }

  showWidgetBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'showWidget' }, (response) => {
        if (chrome.runtime.lastError) {
          showStatus('Please refresh the page to use the widget', 'success');
        } else {
          showStatus('Widget shown!', 'success');
        }
      });
    });
  });

  openSettingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});
