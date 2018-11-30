import React, { Fragment } from 'react'
import PropTypes from 'prop-types'

const Status = props =>
  <Fragment>
    <i className={ `${props.icon || 'fas fa-cog'} fa-2x${props.spin ? ' fa-spin' : ''}` }></i>
    <span style={{ marginTop: '5px' }}>{ props.text }</span>
  </Fragment>

Status.propTypes = {
  icon: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  spin: PropTypes.bool,
}

export default Status
