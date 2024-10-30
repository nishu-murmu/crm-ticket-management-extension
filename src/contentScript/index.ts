import { config } from '../utils/config'
import { injectButtons } from './injectButtons'

function injectTicketManager() {
  if (location.href !== config.CRM_TICKETS_PAGE) return

  const daysWithoutReplyThresholds = { yellow: 2, orange: 5, red: 7 }
  const styleSheet = document.createElement('style')
  styleSheet.textContent = `
    /* Modern container styles */
    .has-row-options {
        background: #fff !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        border-radius: 12px !important;
        margin: 12px 0 !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
        backdrop-filter: blur(8px) !important;
        border: 1px solid rgba(0,0,0,0.06) !important;
    }

    .has-row-options:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 8px 16px rgba(0,0,0,0.08) !important;
    }

    .has-row-options td {
        padding: 18px 16px !important;
        vertical-align: middle !important;
        font-size: 14px !important;
        line-height: 1.5 !important;
        color: #1F2937 !important;
    }

    /* Enhanced status badge */
    .ticket-status-1 {
        display: inline-flex !important;
        align-items: center !important;
        padding: 6px 14px !important;
        border-radius: 24px !important;
        font-size: 12px !important;
        font-weight: 600 !important;
        letter-spacing: 0.6px !important;
        background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%) !important;
        color: #1B5E20 !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
    }

    /* Modern priority indicators */
    .priority-indicator {
        width: 10px !important;
        height: 10px !important;
        border-radius: 50% !important;
        display: inline-block !important;
        margin-right: 10px !important;
        box-shadow: 0 0 0 2px rgba(255,255,255,0.8) !important;
    }

    .priority-high { background: linear-gradient(135deg, #FF5252 0%, #F44336 100%) !important; }
    .priority-medium { background: linear-gradient(135deg, #FFB74D 0%, #FFA726 100%) !important; }
    .priority-low { background: linear-gradient(135deg, #81C784 0%, #66BB6A 100%) !important; }

    /* Refined assignee card */
    .assignee-name {
        background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%) !important;
        border: 1px solid rgba(0,0,0,0.08) !important;
        border-radius: 10px !important;
        padding: 10px 14px !important;
        margin-top: 8px !important;
        font-size: 13px !important;
        color: #334155 !important;
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        box-shadow: 0 2px 6px rgba(0,0,0,0.04) !important;
    }

    .assignee-avatar {
        width: 28px !important;
        height: 28px !important;
        border-radius: 50% !important;
        background: linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 13px !important;
        color: #475569 !important;
        font-weight: 600 !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
    }

    /* Enhanced days badge */
    .days-badge {
        display: inline-flex !important;
        align-items: center !important;
        padding: 6px 12px !important;
        border-radius: 8px !important;
        font-size: 12px !important;
        font-weight: 600 !important;
        gap: 6px !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
    }

    .days-badge.warning {
        background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%) !important;
        color: #E65100 !important;
    }

    .days-badge.danger {
        background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%) !important;
        color: #C62828 !important;
    }

    /* Modern category tags */
    .ticket-category {
        display: inline-flex !important;
        align-items: center !important;
        padding: 8px 14px !important;
        border-radius: 8px !important;
        font-size: 12px !important;
        font-weight: 600 !important;
        background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%) !important;
        color: #374151 !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
    }
`

  document.head.appendChild(styleSheet)

  // Existing helper functions remain unchanged
  function calculateDaysBetween(date1, date2) {
    const differenceInTime = date2.getTime() - date1.getTime()
    return differenceInTime / (1000 * 3600 * 24)
  }

  function parseCustomDate(dateString) {
    if (!dateString || !dateString.includes(' ')) return NaN

    const [datePart, timePart] = dateString.split(' ')
    const [day, month, year] = datePart.split('-').map(Number)
    let [hour, minute] = timePart.split(':').map(Number)
    const period = timePart.split(' ')[1]

    if (period === 'PM' && hour < 12) hour += 12
    if (period === 'AM' && hour === 12) hour = 0

    return new Date(year, month - 1, day, hour, minute)
  }
  function getAssigneeName(row) {
    const nameExtractors = [
      (row) => row.querySelector('.name-tag, .assignee-tag, .user-tag')?.textContent?.trim(),
      (row) => row.querySelector('a.user-link, a.assignee-link')?.textContent?.trim(),
      (row) => row.querySelector('.assigned-to, .assignee-name')?.textContent?.trim(),
      (row) => {
        const element = row.querySelector('[data-assignee], [data-assigned-to]')
        return element?.getAttribute('data-assignee') || element?.getAttribute('data-assigned-to')
      },
      (row) => {
        const tooltipElement = row.querySelector('[title], [data-original-title]')
        return (
          tooltipElement?.getAttribute('title') ||
          tooltipElement?.getAttribute('data-original-title')
        )
      },
      (row) => {
        const profileImg = row.querySelector('img[alt]')
        return profileImg?.getAttribute('alt')?.replace('Profile picture of ', '')?.trim()
      },
    ]

    for (const extractor of nameExtractors) {
      try {
        const name = extractor(row)
        if (name && name.length > 0 && name !== 'undefined' && name !== 'null') {
          if (name.length >= 2 && name.length <= 50 && /^[A-Za-z\s\-'.]+$/.test(name)) {
            return name
          }
        }
      } catch (error) {
        console.warn('Error in name extractor:', error)
      }
    }
    return null
  }

  // Updated color palette
  const colors = {
    yellow: '#FFF8E1',
    orange: '#FFE0B2',
    red: '#FFEBEE',
    bugFixRed: '#FDE7E7',
    customizationOrange: '#FFF3E0',
    deadlineRed: '#FFEBEE',
    noReplyYet: '#F3E5F5',
  }

  document.querySelectorAll('.days-badge, .assignee-name').forEach((element) => element.remove())

  const today = new Date()
  const ticketRows = document.querySelectorAll('.has-row-options') as NodeListOf<HTMLElement>

  ticketRows.forEach((row) => {
    row.classList.add('clickable')

    const categoryElement = row.querySelector('td:nth-last-child(1)')
    const categoryText = categoryElement?.textContent?.trim().toLowerCase() || ''

    // Enhanced category styling
    if (categoryElement) {
      categoryElement.innerHTML = `
            <div class="ticket-category">
                ${categoryText.charAt(0).toUpperCase() + categoryText.slice(1)}
            </div>
        `
    }

    if (categoryText === 'bug fix') {
      row.style.setProperty('--highlight-color', colors.bugFixRed)
      row.classList.add('ticket-row-highlighted')
      row.querySelectorAll('td').forEach((cell) => {
        cell.style.backgroundColor = colors.bugFixRed
      })
      return
    }
    const lastReplyElement = row.querySelector('td:nth-child(10)')
    if (lastReplyElement) {
      const lastReplyText = lastReplyElement.textContent?.trim()
      if (lastReplyText && lastReplyText !== 'No Reply Yet') {
        const lastReplyDate = parseCustomDate(lastReplyText) as number
        if (!isNaN(lastReplyDate)) {
          const daysWithoutReply = Math.floor(calculateDaysBetween(lastReplyDate, today))

          let color = ''
          let badgeClass = ''

          if (daysWithoutReply > daysWithoutReplyThresholds.orange) {
            color = colors.red
            badgeClass = 'danger'
          } else if (daysWithoutReply > daysWithoutReplyThresholds.yellow) {
            color = colors.orange
            badgeClass = 'warning'
          } else {
            color = colors.yellow
          }

          if (color) {
            row.style.setProperty('--highlight-color', color)
            row.classList.add('ticket-row-highlighted')
            row.querySelectorAll('td').forEach((cell) => {
              cell.style.backgroundColor = color
            })

            const badge = document.createElement('span')
            badge.className = `days-badge ${badgeClass}`
            badge.textContent = `${daysWithoutReply} days`
            lastReplyElement.appendChild(badge)
          }
        }
      } else {
        row.style.setProperty('--highlight-color', colors.noReplyYet)
        row.classList.add('ticket-row-highlighted')
        row.querySelectorAll('td').forEach((cell) => {
          cell.style.backgroundColor = colors.noReplyYet
        })
      }
    }

    // Rest of the existing functionality remains unchanged
    // Status enhancement
    const statusElement = row.querySelector('.ticket-status-1')
    if (!statusElement?.textContent) {
      return
    }
    const status = statusElement.textContent.trim().toLowerCase()
    statusElement.innerHTML = `
        <span class="priority-indicator priority-${status === 'high' ? 'high' : status === 'medium' ? 'medium' : 'low'}"></span>
        ${status.toUpperCase()}
    `

    // Assignee name enhancement
    const assigneeName = getAssigneeName(row)
    if (assigneeName) {
      const initials = assigneeName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()

      const assigneeNameElement = document.createElement('div')
      assigneeNameElement.className = 'assignee-name clickable'
      assigneeNameElement.innerHTML = `
          <div class="assignee-avatar">${initials}</div>
          ${assigneeName}
      `

      const container =
        row.querySelector('a[title]')?.parentNode ||
        row.querySelector('.assignee-cell') ||
        row.querySelector('.user-cell')

      if (container) {
        container.appendChild(assigneeNameElement)
      }
    }
  })

  injectButtons()
}

injectTicketManager()
