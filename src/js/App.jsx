import React, { Component } from 'react'

import Context from './Context.jsx'

class App extends Component {
  static contextType = Context

  render () {
    return (
      <div className="App">
        { JSON.stringify(this.context) }
      </div>
    )
  }
}

export default App
