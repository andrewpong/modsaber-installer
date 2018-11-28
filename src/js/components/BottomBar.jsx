import React, { Component } from 'react'
import Context from '../Context.jsx'

class BottomBar extends Component {
  static contextType = Context

  render () {
    return (
      <>
        <span className='status'>Status: { this.context.statusText }</span>

        <button className='button'>View Selected Mod Info</button>
        <button className='button'>Install / Update</button>
      </>
    )
  }
}

export default BottomBar
