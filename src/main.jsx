import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Font tự lưu trong dự án (có bộ chữ tiếng Việt), không phụ thuộc Google Fonts.
import '@fontsource/playfair-display/500.css'
import '@fontsource/playfair-display/400-italic.css'
import '@fontsource/playfair-display/500-italic.css'
import '@fontsource/cormorant-garamond/400.css'
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/400-italic.css'
import '@fontsource/pinyon-script/400.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
