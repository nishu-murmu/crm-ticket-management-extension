import { injectComponent } from '.'
import { injectStyles } from '../../utils/config'
import { generate_blackbox_report } from '../blackbox'

const AnalysisButton = () => {
  const handleClick = () => {
    const report = generate_blackbox_report()
    console.log({ report })
  }

  return (
    <div className="flex items-center gap-2 mb-4">
      <button
        onClick={handleClick}
        className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 
                 text-white font-medium rounded-lg transition-colors duration-200"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        Generate Analysis
      </button>
    </div>
  )
}

// Function to inject the button
const BlackBoxButtonComponent = () => {
  const cssFiles = [injectStyles(chrome.runtime.getURL('/src/styles/output.css'))]
  injectComponent(
    <AnalysisButton />,
    { id: 'enacton-crm-button', position: 'fixed', zIndex: '99999999' },
    cssFiles,
  )
}

export default BlackBoxButtonComponent
