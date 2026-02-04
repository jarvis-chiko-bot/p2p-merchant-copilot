chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    const defaultTemplates = [
      { id: 1, text: "Hi! I can help you with this trade. What's your preferred payment method?" },
      { id: 2, text: "Thanks for your order! Please send the payment and I'll release the crypto right away." },
      { id: 3, text: "I've received your payment. Releasing the crypto now, please confirm once received." },
      { id: 4, text: "Hello! I'm online and ready to trade. Do you have any questions?" },
      { id: 5, text: "Thank you for trading with me! Please leave a positive review if everything went well." }
    ];

    chrome.storage.sync.set({
      templates: defaultTemplates,
      defaultFee: 1
    }, () => {
      console.log('P2P Merchant Copilot: Default settings initialized');
    });

    chrome.tabs.create({
      url: chrome.runtime.getURL('options.html')
    });
  }
});

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: 'showWidget' });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    chrome.storage.sync.get(['templates', 'defaultFee'], (result) => {
      sendResponse(result);
    });
    return true;
  }
  
  if (request.action === 'saveSettings') {
    chrome.storage.sync.set({
      templates: request.templates,
      defaultFee: request.defaultFee
    }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
