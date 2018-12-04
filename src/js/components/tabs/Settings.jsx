import React, { Component } from 'react'
import Helmet from 'react-helmet'
import Context from '../../Context.jsx'

class Settings extends Component {
  static contextType = Context

  render () {
    return (
      <>
        <Helmet>
          <style>
            { `div.box#main { justify-content: initial; align-items: initial; padding: 15px; overflow-y: scroll; }` }
          </style>
        </Helmet>

        <div className='content'>
          <h1>Settings</h1>
          <hr />

          <h3>Theme</h3>
          <div className='select'>
            <select value={ this.context.theme } onChange={ e => this.context.setTheme(e.target.value) }>
              <option value='light'>Light</option>
              <option value='dark'>Dark</option>
            </select>
          </div>
        </div>
      </>
    )
  }
}

export default Settings
