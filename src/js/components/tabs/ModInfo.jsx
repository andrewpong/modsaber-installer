import React, { Component } from 'react'
import Helmet from 'react-helmet'

import Context from '../../Context.jsx'
import MarkdownRenderer from '../Markdown.jsx'

class ModInfo extends Component {
  static contextType = Context

  render () {
    const mod = this.context.mods[this.context.selected]

    return (
      <>
        <Helmet>
          <style>
            { `div.box#main { justify-content: initial; align-items: initial; padding: 15px; overflow-y: scroll; }` }
          </style>
        </Helmet>

        <div className='content'>
          <h1>{ mod.details.title }</h1>
          <hr />

          <MarkdownRenderer source={ mod.details.description } />
        </div>
      </>
    )
  }
}

export default ModInfo
