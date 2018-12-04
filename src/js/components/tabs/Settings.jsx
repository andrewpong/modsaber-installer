import React, { Component } from 'react'
import Context from '../../Context.jsx'

class Settings extends Component {
  static contextType = Context

  toggleTheme () {
    const theme = this.context.theme === 'dark' ? 'light' : 'dark'
    this.context.setTheme(theme)
  }

  render () {
    return (
      <button className='button' onClick={ () => this.toggleTheme() }>Toggle Theme</button>
    )
  }
}

export default Settings
