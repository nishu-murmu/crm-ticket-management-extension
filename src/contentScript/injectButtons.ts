export function injectButtons() {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = `
      .report-buttons {
          position: fixed !important;
          top: 80px !important;
          right: 20px !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 10px !important;
          z-index: 9999 !important;
          padding: 16px !important;
          background: white !important;
          border-radius: 8px !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
      }

      .report-btn {
          padding: 10px 20px !important;
          background: #4F46E5 !important;
          color: white !important;
          border: none !important;
          border-radius: 6px !important;
          cursor: pointer !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          min-width: 200px !important;
      }

      .report-btn:hover {
          background: #4338CA !important;
      }

      .loading {
          opacity: 0.7;
          cursor: wait;
      }
  `
  document.head.appendChild(styleSheet)

  function generateAssigneeReport() {
    const ticketRows = document.querySelectorAll('tr')
    const assigneeTicketsMap = {}

    ticketRows.forEach((row) => {
      const assigneeLink = row.querySelector('a[title]')
      const ticketLinkElement = row.querySelector('a[href*="tickets/"]') as HTMLAnchorElement

      if (assigneeLink && ticketLinkElement) {
        const assigneeName = assigneeLink.getAttribute('title') || ('' as string)
        const ticketLink = ticketLinkElement.href

        if (!assigneeTicketsMap[assigneeName]) {
          assigneeTicketsMap[assigneeName] = []
        }
        assigneeTicketsMap[assigneeName].push(ticketLink)
      }
    })

    let fileContent = 'Tickets grouped by assignee:\n\n'
    Object.keys(assigneeTicketsMap).forEach((assigneeName) => {
      fileContent += `Name: ${assigneeName}\n`
      assigneeTicketsMap[assigneeName].forEach((ticketLink, index) => {
        fileContent += `Ticket ${index + 1}: ${ticketLink}\n`
      })
      fileContent += '\n'
    })

    const blob = new Blob([fileContent], { type: 'text/plain' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'ticket_data.txt'
    link.click()
  }

  // Script for Project Report (Original Working Version)
  function generateProjectReport() {
    const ticketRows = document.querySelectorAll('tr')
    const contactTicketsMap = {}

    ticketRows.forEach((row) => {
      const contactLink = row.querySelector('a[href*="clients/"]')
      const ticketLinkElement = row.querySelector('a[href*="tickets/"]') as HTMLAnchorElement

      if (contactLink && ticketLinkElement) {
        const contactName = contactLink.textContent?.trim() || ('' as string)
        const ticketLink = ticketLinkElement.href

        if (!contactTicketsMap[contactName]) {
          contactTicketsMap[contactName] = []
        }
        contactTicketsMap[contactName].push(ticketLink)
      }
    })

    let fileContent = 'Tickets grouped by contact:\n\n'
    Object.keys(contactTicketsMap).forEach((contactName) => {
      fileContent += `Contact: ${contactName}\n`
      contactTicketsMap[contactName].forEach((ticketLink, index) => {
        fileContent += `Ticket ${index + 1}: ${ticketLink}\n`
      })
      fileContent += '\n'
    })

    const blob = new Blob([fileContent], { type: 'text/plain' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'contact_tickets.txt'
    link.click()
  }

  // Script to Open Open Tickets (Original Working Version)
  function openOpenTickets() {
    const ticketRows = document.querySelectorAll('table tbody tr')
    const regex = /^https:\/\/crm\.enacton\.com\/admin\/tickets\/ticket\/\d+$/

    const filteredLinks = Array.from(ticketRows)
      .filter((row) => {
        const ticketLinkElement = row.querySelector('a')
        const link = ticketLinkElement ? ticketLinkElement.href : ''

        const statusElement = row.querySelector('span.label.ticket-status-1')
        const status = statusElement ? statusElement.textContent?.trim().toLowerCase() : ''

        return regex.test(link) && status === 'open'
      })
      .map((row) => (row.querySelector('a') as HTMLAnchorElement).href as string)

    filteredLinks.forEach((link) => {
      window.open(link, '_blank')
    })

    console.log('Total number of open tickets:', filteredLinks.length)
  }

  // Add buttons (Simple Version)
  const buttonsDiv = document.createElement('div')
  buttonsDiv.className = 'report-buttons'
  buttonsDiv.innerHTML = `
    <button class="report-btn" id="assigneeReport">Generate Assignee Report</button>
    <button class="report-btn" id="projectReport">Generate Project Report</button>
    <button class="report-btn" id="openTickets">Open All Open Tickets</button>
`
  document.body.appendChild(buttonsDiv)

  // Add simple event listeners
  document.getElementById('assigneeReport')?.addEventListener('click', function () {
    this.classList.add('loading')
    generateAssigneeReport()
    this.classList.remove('loading')
  })

  document.getElementById('projectReport')?.addEventListener('click', function () {
    this.classList.add('loading')
    generateProjectReport()
    this.classList.remove('loading')
  })

  document.getElementById('openTickets')?.addEventListener('click', function () {
    this.classList.add('loading')
    openOpenTickets()
    this.classList.remove('loading')
  })
}