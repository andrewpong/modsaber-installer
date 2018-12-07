import React from 'react'
import * as ReactMarkdown from 'react-markdown'
import Highlight from 'react-highlight'
import PropTypes from 'prop-types'

import 'highlight.js/styles/atom-one-light.css'
import ExtLink from './ExtLink.jsx'

const MarkdownRenderer = props =>
  <ReactMarkdown
    source={ props.source }
    renderers={{ kbd: Keyboard, code: CodeBlock, inlineCode: InlineCode, link: Link }}
    plugins={ [require('remark-kbd')] }
  />

MarkdownRenderer.propTypes = { source: PropTypes.string }

const Keyboard = ({ children }) => <kbd>{ children[0] }</kbd>
Keyboard.propTypes = { children: PropTypes.arrayOf(PropTypes.string).isRequired }

const CodeBlock = props => {
  if (!props.language) return <pre>{ props.value }</pre>

  return (
    <Highlight className={ `language-${props.language}` }>
      { props.value }
    </Highlight>
  )
}
CodeBlock.propTypes = {
  language: PropTypes.string,
  value: PropTypes.string.isRequired,
}

const InlineCode = ({ children }) => <code className='tag is-code'>{ children }</code>
InlineCode.propTypes = { children: PropTypes.string.isRequired }

const Link = ({ children: [text], href }) => <ExtLink href={ href }>{ text }</ExtLink>
Link.propTypes = {
  children: PropTypes.arrayOf(PropTypes.string).isRequired,
  href: PropTypes.string.isRequired,
}

export default MarkdownRenderer
