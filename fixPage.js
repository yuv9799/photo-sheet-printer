const fs = require('fs')
fs.writeFileSync('app/page.tsx', `import Header from './components/Header'
import UploadZone from './components/UploadZone'
import LayoutControls from './components/LayoutControls'
import A4Preview from './components/A4Preview'
import Sidebar from './components/Sidebar'
import Toast from './components/Toast'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <Toast />
      <div className="flex">
        <main className="flex-1 p-4 md:p-6 max-w-5xl">
          <div className="space-y-4">
            <UploadZone />
            <LayoutControls />
            <A4Preview />
          </div>
        </main>
        <Sidebar />
      </div>
      <style>{\`.animate-slide-in { animation: slideIn 0.3s ease-out; } @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }\`}</style>
    </div>
  )
}
`)
console.log('done')