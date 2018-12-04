import React from 'react'
import ReactDOM from 'react-dom'
import App from './js/App.jsx'
import { ControllerProvider } from './js/Context.jsx'

import '@lolpants/bulma/css/bulma.css'
import '@fortawesome/fontawesome-free/css/all.css'
import './css/styles.css'
import './css/dark.css'

ReactDOM.render(
  <ControllerProvider>
    <App />
  </ControllerProvider>,
  document.getElementById('root')
)
