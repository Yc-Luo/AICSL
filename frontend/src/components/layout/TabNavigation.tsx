

import { trackingService } from '../../services/tracking/TrackingService'

const tabs = [
  { id: 'document', label: '文档' },
  { id: 'inquiry', label: '深度探究' },
  { id: 'resources', label: '资源库' },
  { id: 'browser', label: '浏览器' },
  { id: 'ai', label: 'AI 导师' },
  { id: 'dashboard', label: '仪表盘' },
]

interface TabNavigationProps {
  activeTab: string
  onTabChange: (tabId: string) => void
}

export default function TabNavigation({
  activeTab,
  onTabChange,
}: TabNavigationProps) {
  const handleTabChange = (tabId: string) => {
    trackingService.track({
      module: 'dashboard',
      action: 'main_tab_switch',
      metadata: { from: activeTab, to: tabId }
    })
    onTabChange(tabId)
  }

  return (
    <div className="border-b border-gray-200 bg-white">
      <nav className="flex space-x-8 px-4 justify-center" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`
              py-3 px-1 border-b-2 font-medium text-sm transition-all relative
              ${activeTab === tab.id
                ? 'text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}

