/// <reference types="vite/client" />
import 'react'

declare module 'react' {
  // StringTune is attribute driven: string="magnetic", string-strength="0.2", ...
  interface HTMLAttributes<T> {
    string?: string
  }
}
