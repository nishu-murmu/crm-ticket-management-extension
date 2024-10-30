import { config } from '../utils/config'
import { injectButtons } from './injectButtons'

console.info('contentScript is running')

// contentScript.js
function injectTicketManager() {
  if (location.href !== config.CRM_TICKETS_PAGE) {
    return
  }
  const daysWithoutReplyThresholds = { yellow: 2, orange: 5 }
  const styleSheet = document.createElement('style')
  styleSheet.textContent = `
    /* Modern table styles */
    .has-row-options {
        transition: all 0.2s ease-in-out !important;
        border-radius: 8px !important;
        margin: 8px 0 !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
    }

    .has-row-options:hover {
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
    }

    .has-row-options td {
        padding: 16px 12px !important;
        vertical-align: middle !important;
    }

    /* Status badge styles */
    .ticket-status-1 {
        display: inline-block !important;
        padding: 6px 12px !important;
        border-radius: 20px !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
        background-color: #E8F5E9 !important;
        color: #2E7D32 !important;
    }

    /* Priority indicator */
    .priority-indicator {
        width: 8px !important;
        height: 8px !important;
        border-radius: 50% !important;
        display: inline-block !important;
        margin-right: 8px !important;
    }

    .priority-high { background-color: #EF5350 !important; }
    .priority-medium { background-color: #FFA726 !important; }
    .priority-low { background-color: #66BB6A !important; }

    /* Assignee name card */
    .assignee-name {
        background: #fff !important;
        border: 1px solid #E0E0E0 !important;
        border-radius: 8px !important;
        padding: 8px 12px !important;
        margin-top: 8px !important;
        font-size: 13px !important;
        color: #424242 !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
    }

    .assignee-avatar {
        width: 24px !important;
        height: 24px !important;
        border-radius: 50% !important;
        background: #F5F5F5 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 12px !important;
        color: #757575 !important;
        font-weight: 500 !important;
    }

    /* Days badge */
    .days-badge {
        display: inline-flex !important;
        align-items: center !important;
        padding: 4px 8px !important;
        border-radius: 6px !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        gap: 4px !important;
    }

    .days-badge::before {
        content: '⏱️' !important;
        font-size: 12px !important;
    }

    /* Category tags */
    .ticket-category {
        display: inline-flex !important;
        align-items: center !important;
        padding: 6px 12px !important;
        border-radius: 6px !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        background: #F5F5F5 !important;
        color: #616161 !important;
    }

    /* Hover effects for interactive elements */
    .clickable {
        cursor: pointer !important;
        transition: all 0.2s ease !important;
    }

    .clickable:hover {
        opacity: 0.8 !important;
    }
`
  document.head.appendChild(styleSheet)

  // Rest of the helper functions remain the same
  function calculateDaysBetween(date1, date2) {
    const differenceInTime = date2.getTime() - date1.getTime()
    return differenceInTime / (1000 * 3600 * 24)
  }

  function parseCustomDate(dateString) {
    if (!dateString || !dateString.includes(' ')) {
      return NaN
    }

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

  // Updated color palette with more modern colors
  const colors = {
    yellow: '#FFF8E1',
    orange: '#FFE0B2',
    red: '#FFEBEE',
    bugFixRed: '#FFEBEE',
    customizationOrange: '#FFF3E0',
    deadlineRed: '#FFEBEE',
    noReplyYet: '#F3E5F5',
  }

  // Remove existing elements
  document.querySelectorAll('.days-badge, .assignee-name').forEach((element) => element.remove())

  const today = new Date()
  const ticketRows = document.querySelectorAll('.has-row-options') as NodeListOf<HTMLElement>
  let flaggedTicketsCount = 0
  let nameDetectionStats = { success: 0, failed: 0 }

  ticketRows.forEach((row) => {
    // Add modern hover effect to rows
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

    const lastReplyElement = row.querySelector('td:nth-child(10)') as HTMLElement
    if (lastReplyElement) {
      const lastReplyText = lastReplyElement.textContent?.trim()
      if (lastReplyText && lastReplyText !== 'No Reply Yet') {
        const lastReplyDate = parseCustomDate(lastReplyText) as number
        if (!isNaN(lastReplyDate)) {
          const daysWithoutReply = Math.floor(calculateDaysBetween(lastReplyDate, today))

          let color = ''
          if (daysWithoutReply <= daysWithoutReplyThresholds.yellow) {
            color = colors.yellow
          } else if (daysWithoutReply <= daysWithoutReplyThresholds.orange) {
            color = colors.orange
          } else {
            color = ''
          }

          if (color) {
            row.style.setProperty('--highlight-color', color)
            row.classList.add('ticket-row-highlighted')
            row.querySelectorAll('td').forEach((cell) => {
              cell.style.backgroundColor = color
            })
            flaggedTicketsCount++

            const existingBadge = lastReplyElement.querySelector('.days-badge')
            if (existingBadge) {
              existingBadge.remove()
            }

            const badge = document.createElement('span')
            badge.className = 'days-badge'
            badge.textContent = `${daysWithoutReply} days`
            badge.style.padding = '3px 8px'
            badge.style.marginLeft = '8px'
            badge.style.color = '#6b4e16'
            badge.style.fontSize = '12px'
            badge.style.backgroundColor = color
            badge.style.border = '1px solid #6b4e16'
            badge.style.borderRadius = '6px'
            badge.style.fontWeight = '500'
            badge.style.verticalAlign = 'middle'
            badge.style.display = 'inline-block'

            lastReplyElement.appendChild(badge)
          }
        }
      } else {
        row.style.setProperty('--highlight-color', colors.noReplyYet)
        row.classList.add('ticket-row-highlighted')
        row.querySelectorAll('td').forEach((cell) => {
          cell.style.backgroundColor = colors.noReplyYet
        })
        lastReplyElement.style.color = '#6b4e16'
      }
    }

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
      nameDetectionStats.success++
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
    } else {
      nameDetectionStats.failed++
    }

    // Enhanced days badge
  })

  injectButtons()
}

// Make sure to update your popup.js to call this function

injectTicketManager()
