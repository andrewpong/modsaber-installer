import React from 'react'
import ReactDOM from 'react-dom'
import App from './js/App.jsx'
import { ControllerProvider } from './js/Context.jsx'

ReactDOM.render(
  <ControllerProvider>
    <App />
  </ControllerProvider>,
  document.getElementById('root')
)
