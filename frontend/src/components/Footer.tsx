import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="w-full py-2 md:py-4 text-center text-sm text-gray-500 border-t-2 border-black bg-secondary-background">
      <div className="flex flex-col items-center space-y-1 md:space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span>Made with ❤️ in Berlin · 2026</span>
          <span className="hidden sm:inline">·</span>
          <Link
            to="/faq"
            className="hover:text-gray-700 transition-colors"
          >
            F.A.Q
          </Link>
        </div>
        <a
          href="https://www.buymeacoffee.com/dirathea"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-700 transition-colors"
        >
          ☕ Buy me a coffee
        </a>
      </div>
    </footer>
  )
}
