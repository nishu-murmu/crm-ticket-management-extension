import { config } from '../utils/config'

chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({}, (tabs) => {
    const current_tab = tabs.find((tab) => tab.url === config.CRM_TICKETS_PAGE) || 0
    if (current_tab) {
      chrome.tabs.update(current_tab?.id as number, {
        active: true,
      })
      chrome.tabs.reload(current_tab?.id as number)
    } else {
      chrome.tabs.create({
        url: config.CRM_TICKETS_PAGE,
      })
    }
  })
})

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'COUNT') {
    console.log('background has received a message from popup, and count is ', request?.count)
  }
})

chrome.action.onClicked.addListener(() => {
  chrome.tabs.query({}, (tabs) => {
    const current_tab = tabs.find((tab) => tab.url === config.CRM_TICKETS_PAGE) || { id: 0 }
    chrome.tabs.reload(current_tab?.id as number)
  })
})
