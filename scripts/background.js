chrome.action.onClicked.addListener(function() {
    // Open the second URL
    // Open the first URL
    chrome.tabs.create({ url: 'https://chat.openai.com/' });
    chrome.tabs.create({ url: 'https://claude.ai/chats' });
  });
  