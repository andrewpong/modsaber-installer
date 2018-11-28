import React, { Component } from 'react'

import Context from './Context.jsx'
import PathPicker from './components/PathPicker.jsx'
import MainTabs from './components/MainTabs.jsx'
import BottomBar from './components/BottomBar.jsx'

class App extends Component {
  static contextType = Context

  render () {
    return (
      <div className='layout'>
        <div className='layout-item top'>
          <PathPicker />
        </div>

        <div className='layout-item main'>
          <MainTabs />
        </div>

        <div className='layout-item bottom'>
          <BottomBar />
        </div>
      </div>
    )
  }
}

export default App
