import React, { Component } from 'react'

import Help from './tabs/Help.jsx'
import Credits from './tabs/Credits.jsx'

class MainTabs extends Component {
  constructor (props) {
    super(props)

    this.pages = [
      { title: 'Mods', component: <div></div> },
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
