import { config } from '../utils/config'
import { v4 as uuidv4 } from 'uuid'
import BlackBoxButtonComponent from './components/BlackBox'

function get_chats_from_page() {
  // Function to clean text content by removing extra whitespace and newlines
  const cleanText = (text) => {
    return text.replace(/\s+/g, ' ').replace(/\n+/g, ' ').trim()
  }

  // Function to extract chats from HTML content
  const extractChats = (htmlContent) => {
    // Create a DOM parser
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')

    // Find all panel bodies containing chats
    const chatPanels = doc.querySelectorAll('.panel-body')
    const chats = [] as { name: string; type: string; chat: string }[]

    chatPanels.forEach((panel) => {
      // Skip if it's not a chat panel
      if (!panel.querySelector('.ticket-submitter-info')) return

      // Determine if it's a client reply
      const isClient = panel.classList.contains('client-reply')

      // Extract name
      const nameElement = panel.querySelector('.ticket-submitter-info p:first-child a')
      if (!nameElement) return
      const name = (nameElement.textContent?.trim() || '') as string

      // Extract chat content
      const contentElement = panel.querySelector('.tc-content')
      if (!contentElement) return
      const chat = cleanText(contentElement.textContent)

      // Create chat object
      chats.push({
        name: name,
        type: isClient ? 'customer' : 'staff',
        chat: chat,
      })
    })

    return chats
  }

  // Function to format chats as text
  const formatChatsAsText = (chats) => {
    return chats
      .map((chat, index) => {
        return `=== Message ${index + 1} ===
Name: ${chat.name}
Type: ${chat.type}
Message: ${chat.chat}
`
      })
      .join('\n')
  }

  // Main execution
  const htmlContent = document.documentElement.innerHTML
  const chats = extractChats(htmlContent)
  return formatChatsAsText(chats)
}

function provide_custom_prompt() {
  return `Summarize the following ticket conversation between our support team and the client, providing a clear and cohesive overview as though you’re explaining the conversation to a teammate. Include key points, such as the client’s initial questions or issues, how the team responded, any follow-up questions or clarifications, and the final outcomes or next steps. Focus on clarity and brevity. Structure the summary in this format:

Client's Initial Inquiry: Summarize the client's first message or question.
Team's Response (Staff Name): Summarize the support team’s initial response, noting who responded and any clarifications they provided.
Follow-ups and Clarifications: Briefly cover any further questions, concerns, or clarifications raised by either the client or the team, with staff names for each response.
Resolution or Next Steps: Summarize the agreed-upon solution, resolution, or any remaining actions for both parties.
Finally, indicate the Current Status of the ticket, specifying whether we are awaiting input from the client, the client is awaiting our input, or if our team is actively working on the client's requirements and will provide an update soon.

Here are the messages, categorized by sender, message type (staff or client), and staff name for each response:

${get_chats_from_page()}`
}

export async function generate_blackbox_report() {
  const prompt = provide_custom_prompt()
  const message_id = uuidv4()
  await fetch(config.BLACKBOX_API_ENDPOINT, {
    headers: {
      accept: '*/*',
      'accept-language': 'en-GB,en;q=0.7',
      'cache-control': 'no-cache',
      'content-type': 'application/json',
      pragma: 'no-cache',
      priority: 'u=1, i',
      'sec-ch-ua': '"Chromium";v="130", "Brave";v="130", "Not?A_Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'sec-gpc': '1',
    },
    referrer: 'https://www.blackbox.ai/',
    referrerPolicy: 'strict-origin-when-cross-origin',
    body: `{"messages":[{"id":${message_id},"content":${prompt},"role":"user"}],"id":${message_id},"previewToken":null,"userId":null,"codeModelMode":true,"agentMode":{},"trendingAgentMode":{},"isMicMode":false,"userSystemPrompt":null,"maxTokens":1024,"playgroundTopP":0.9,"playgroundTemperature":0.5,"isChromeExt":false,"githubToken":null,"clickedAnswer2":false,"clickedAnswer3":false,"clickedForceWebSearch":false,"visitFromDelta":false,"mobileClient":false,"userSelectedModel":null}`,
    method: 'POST',
    mode: 'cors',
    credentials: 'include',
  }).then((r) => r.text())
}

function inject_action_button() {
  BlackBoxButtonComponent()
}

inject_action_button()
