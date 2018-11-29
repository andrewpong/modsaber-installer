import React, { Component, Fragment } from 'react'
import Helmet from 'react-helmet'
import Context from '../../Context.jsx'

import '../../../css/scrollbar.css'
import '../../../css/table.css'

class Mods extends Component {
  static contextType = Context

  categorize (mods) {
    const categories = []
    for (const index in mods) {
      const mod = mods[index]
      mod.index = index

      const other = 'Other'
      const category = mod.meta.category

      if (!categories.find(x => x.name === category)) categories.push({ name: category, weight: 0, mods: [] })
      const current = categories.find(x => x.name === category)

      current.mods.push(mod)
      if (category !== other) current.weight += mod.meta.weight
      else current.weight -= 10
    }

    categories.sort((a, b) => {
      const weight = b.weight - a.weight
      if (weight !== 0) return weight
      return a.name > b.name ? 1 : b.name > a.name ? -1 : 0
    })

    return [...categories]
  }

  render () {
    const { filteredMods } = this.context
    const categories = this.categorize(filteredMods)

    return (
      <>
        <Helmet>
          <style>
            { `div.box#main { justify-content: initial; padding: 15px; padding-top: 8px; overflow-y: scroll; }` }
          </style>
        </Helmet>

        <table className='table is-narrow is-fullwidth'>
          <thead>
            <div onClick={ () => { this.context.setSelected(null) } } className='header'></div>
            <tr>
              <th>-<div></div></th>
              <th>Name<div>Name</div></th>
              <th>Author<div>Author</div></th>
              <th>Version<div>Version</div></th>
            </tr>
          </thead>

          <tbody>{ categories.map(({ name, mods }, i) =>
            <Fragment key={ i }>
              <tr onClick={ () => { this.context.setSelected(null) } }>
                <td colSpan={ 4 }>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <b style={{ marginRight: '12px' }}>{ name }</b>
                    <div style={{
                      flexGrow: 1,
                      height: '1px',
                      backgroundColor: 'rgba(50, 115, 220, .75)',
                    }}></div>
                  </div>
                </td>
              </tr>

              { mods.map((mod, j) =>
                <tr
                  key={ j }
                  style={{ backgroundColor: !(mod.index === this.context.selected) ? null : 'rgba(50, 115, 220, 0.1)' }}
                  onClick={ e => { if (e.target.type !== 'checkbox') this.context.setSelected(mod.index) } }
                >
                  <td style={{ padding: 0, paddingLeft: '0.5em' }}>
                    <div className="field">
                      <input
                        type='checkbox'
                      />
                      <label></label>
                    </div>
                  </td>
                  <td className='monospaced'>{ mod.name }</td>
                  <td className='monospaced'>{ mod.details.author.name }</td>
                  <td className='monospaced'>{ mod.version }</td>
                </tr>
              ) }
            </Fragment>
          )}</tbody>
        </table>
      </>
    )
  }
}

export default Mods
