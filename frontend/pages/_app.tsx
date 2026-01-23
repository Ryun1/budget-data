import type { AppProps } from 'next/app'
import '../styles/globals.css'
import '../styles/components.css'
import '../styles/status.css'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
