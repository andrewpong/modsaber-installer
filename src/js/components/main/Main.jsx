import React, { Component } from 'react'

import * as c from '../../constants.js'

import Context from '../../Context.jsx'
import Status from './Status.jsx'
import Mods from './Mods.jsx'

class Main extends Component {
  static contextType = Context

  render () {
    if (this.context.status === c.STATUS_LOADING || this.context.status === c.STATUS_WORKING) {
      return <Status text={ `${this.context.status === c.STATUS_LOADING ? 'Loading' : 'Working'}...` } spin />
    }

    if (this.context.status === c.STATUS_OFFLINE) {
      return <Status text='Offline' icon='fas fa-exclamation-triangle' />
    }

    if (this.context.mods.length === 0) {
      return <Status text='No Mods' icon='fas fa-exclamation-triangle' />
    }

    return <Mods />
  }
}

export default Main
