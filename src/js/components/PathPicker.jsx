import React, { Component } from 'react'
import Context from '../Context.jsx'

class PathPicker extends Component {
  static contextType = Context

  render () {
    return (
      <>
        <div className='field is-expanded has-addons'>
          <div className='control has-icons-left is-fullwidth'>
            <input
              type='text'
              className='input'
              readOnly
              value={ this.context.install.path || '' }
            />

            <span className='icon is-left'>
              <i className='far fa-folder-open'></i>
            </span>
          </div>

          <div className='control'>
            <button className='button'>
              ..
            </button>
          </div>
        </div>
      </>
    )
  }
}

export default PathPicker
