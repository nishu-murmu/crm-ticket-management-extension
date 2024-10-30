export const config = {
  CRM_TICKETS_PAGE: 'https://crm.enacton.com/admin/tickets/index/1',
  CRM_TICKET_PAGE: 'https://crm.enacton.com/admin/tickets/ticket/',
  BLACKBOX_API_ENDPOINT: 'https://www.blackbox.ai/api/chat',
}

export function injectStyles(href: string) {
  let linkElement = document.createElement('link')
  linkElement.rel = 'stylesheet'
  linkElement.type = 'text/css'
  linkElement.href = href
  return linkElement
}
