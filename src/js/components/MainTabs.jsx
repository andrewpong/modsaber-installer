import React, { Component } from 'react'
import Context from '../Context.jsx'

import * as c from '../constants.js'

import Mods from './tabs/Mods.jsx'
import Help from './tabs/Help.jsx'
import Credits from './tabs/Credits.jsx'

class MainLoader extends Component {
  static contextType = Context

  render () {
    if (this.context.status === c.STATUS_LOADING) {
      return (
        <>
          <i className='fas fa-spin fa-cog fa-2x'></i>
          <span style={{ marginTop: '5px' }}>Loading...</span>
        </>
      )
    }

    if (this.context.status === c.STATUS_OFFLINE) {
      return (
        <>
          <i className='fas fa-exclamation-triangle fa-2x'></i>
          <span style={{ marginTop: '5px' }}>Offline</span>
        </>
      )
    }

    return <Mods />
  }
}

class MainTabs extends Component {
  constructor (props) {
    super(props)

    this.pages = [
      { title: 'Mods', component: <MainLoader /> },
      { title: 'Help', component: <Help /> },
      { title: 'Credits', component: <Credits /> },
    ]

    this.state = { selected: 0 }
  }

  render () {
    return (
      <>
        <div className='tabs'>
          <ul>{ this.pages.map(({ title }, i) =>
            <li key={ i } className={ this.state.selected === i ? 'is-active' : '' }>
              <a
                href='/'
                draggable={ false }
                onClick={ e => {
                  e.preventDefault()
                  this.setState({ selected: i })
                } }
              >
                { title }
              </a>
            </li>
          ) }</ul>
        </div>

        <div className='box' id='main'>
          { this.pages[this.state.selected].component }
        </div>
      </>
    )
  }
}

export default MainTabs
