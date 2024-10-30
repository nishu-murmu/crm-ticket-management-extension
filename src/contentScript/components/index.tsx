import ReactDOM from 'react-dom/client'

function RootElement({
  id,
  position,
  zIndex,
  display,
  ...attributes
}: {
  id: string
  zIndex?: string
  display?: string
  position?: string
  attributes?: any
}) {
  let rootElement = document.createElement('div')
  rootElement.id = id
  if (display) {
    rootElement.style.display = display
  }
  if (position) rootElement.style.position = position
  if (zIndex) rootElement.style.zIndex = zIndex
  Object.entries(attributes).map(([key, value]) => {
    rootElement.style[key] = value
  })
  return rootElement
}

export function injectComponent(component: any, rootElemStyles: any, cssFiles: any) {
  const root = RootElement(rootElemStyles)
  document.body.prepend(root)
  const shadow = root.attachShadow({ mode: 'closed' }) as ShadowRoot
  cssFiles.map((cssFile: HTMLLinkElement) => {
    shadow.append(cssFile)
  })
  ReactDOM.createRoot(shadow as ShadowRoot).render(component)
}
