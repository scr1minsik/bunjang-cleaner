let autoSearchEnabled = true;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getAutoSearchEnabled') {
    sendResponse({ autoSearchEnabled });
  } else if (message.type === 'setAutoSearchEnabled') {
    autoSearchEnabled = message.value;
    sendResponse({ success: true });
  }
  return true;
});
