import React, { Component } from 'react'
import Context from '../Context.jsx'

import Main from './main/Main.jsx'
import Help from './tabs/Help.jsx'
import Credits from './tabs/Credits.jsx'

class MainTabs extends Component {
  static contextType = Context

  constructor (props) {
    super(props)

    this.pages = [
      { title: 'Mods', component: <Main /> },
      { title: 'Help', component: <Help /> },
      { title: 'Credits', component: <Credits /> },
    ]
  }

  render () {
    const pages = this.context.selected === null ? this.pages :
      [...this.pages, { title: 'Mod Info', component: <div></div> }]

    const selected = this.context.currentPage > pages.length - 1 ? 0 :
      this.context.currentPage

    return (
      <>
        <div className='tabs'>
          <ul>{ pages.map(({ title }, i) =>
            <li key={ i } className={ selected === i ? 'is-active' : '' }>
              <a
                href='/'
                draggable={ false }
                onClick={ e => {
                  e.preventDefault()
                  this.context.setCurrentPage(i)
                } }
              >
                { title }
              </a>
            </li>
          ) }</ul>
        </div>

        <div className='box' id='main'>
          { pages[selected].component }
        </div>
      </>
    )
  }
}

export default MainTabs
