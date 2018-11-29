import React, { Component } from 'react'
import semver from 'semver'
import PropTypes from 'prop-types'

import * as c from './constants.js'

/**
 * @type {Electron}
 */
const electron = window.require('electron')
const { ipcRenderer } = electron
const { dialog } = electron.remote

const Context = React.createContext()
const { Provider, Consumer } = Context

export class ControllerProvider extends Component {
  constructor (props) {
    super(props)

    this.state = {
      statusText: c.STATUS_TEXT_IDLE,
      install: { path: null, platform: 'unknown' },
      status: c.STATUS_LOADING,

      mods: [],
      gameVersions: [],
      filteredMods: [],

      selected: null,
    }

    ipcRenderer.on('set-path', (_, install) => this.setState({ install }))
    ipcRenderer.on('set-remote', (_, { status, mods, gameVersions }) => {
      if (status === 'error') return this.setState({ statusText: c.STATUS_TEXT_OFFLINE, status: c.STATUS_OFFLINE })

      this.setState({
        statusText: c.STATUS_TEXT_LOADED,
        status: c.STATUS_LOADED,
        mods,
        gameVersions,
      }, () => { this.filterMods() })
    })
  }

  static propTypes = {
    children: PropTypes.node.isRequired,
  }

  componentDidMount () {
    ipcRenderer.send('get-path')
    ipcRenderer.send('get-remote')
  }

  filterMods (index = 0) {
    const { mods, gameVersions } = this.state
    const gameVersion = gameVersions[index] || {}

    const filteredMods = mods
      .filter(mod => mod !== null)
      .filter(mod => mod.gameVersion.manifest === gameVersion.manifest)
      .map(mod => {
        mod.meta.category = mod.meta.category || c.CATEGORY_DEFAULT
        return mod
      })
      .map(mod => {
        mod.install = {
          selected: c.MODS_DEFAULT.includes(mod.name),
          requiredBy: c.MODS_REQUIRED.includes(mod.name) ? ['global'] : [],
          conflictsWith: [],
        }

        return mod
      })

    this.setState({ filteredMods, selected: null })
  }

  toggleMod (index) {
    // Deep clone
    const mods = JSON.parse(JSON.stringify(this.state.filteredMods))
    const mod = mods[index]

    const locked = mod.install.requiredBy.length > 0 || mod.install.conflictsWith.length > 0
    if (locked) return undefined

    mod.install.selected = !mod.install.selected

    if (mod.install.selected) this.checkMod(mod, mods)
    else this.uncheckMod(mod, mods)
  }

  checkMod (mod, mods) {
    const depKeys = this.findLinks(mod, mods, 'dependencies', true)
    for (const key of depKeys) {
      const [name, version] = key.split('@')
      const depMod = mods.find(x => x.name === name && x.version === version)

      depMod.install.requiredBy = [...depMod.install.requiredBy, this.modKey(mod)]
    }

    const conflicts = this.findLinks(mod, mods, 'conflicts', true)
    for (const conflictKey of conflicts) {
      const [name, version] = conflictKey.split('@')
      const conflict = mods.find(x => x.name === name && x.version === version)

      conflict.install.conflictsWith = [...conflict.install.conflictsWith, this.modKey(mod)]

      const selected = conflict.install.selected || conflict.install.requiredBy.length > 0 || false
      if (!selected) continue

      return dialog.showMessageBox({
        title: 'Conflicting Mod',
        type: 'error',
        message:
          `This mod conflicts with ${conflict.details.title} v${conflict.version}\n\n` +
          `Uncheck it and try again!`,
      })
    }

    this.setState({ filteredMods: mods })
  }

  uncheckMod (mod, mods) {
    const key = this.modKey(mod)
    const otherMods = mods.filter(x => x.install.requiredBy.includes(key) || x.install.conflictsWith.includes(key))

    for (const otherModIdx in otherMods) {
      otherMods[otherModIdx].install.requiredBy =
        otherMods[otherModIdx].install.requiredBy.filter(x => x !== key)

      otherMods[otherModIdx].install.conflictsWith =
        otherMods[otherModIdx].install.conflictsWith.filter(x => x !== key)
    }

    this.setState({ filteredMods: mods })
  }

  modKey (mod) {
    return `${mod.name}@${mod.version}`
  }

  /**
   * @param {any} mod Mod to search
   * @param {any[]} mods Array of Mods
   * @param {('dependencies'|'conflicts')} type Type
   * @param {boolean} [keys] Checked
   * @returns {string[]}
   */
  findLinks (mod, mods, type, keys = false) {
    const modsClone = JSON.parse(JSON.stringify(mods))

    const links = type === 'dependencies' ? mod.links.dependencies : mod.links.conflicts
    const recursiveSearch = this.findLinksR(links, modsClone, type)
      .filter(x => x !== this.modKey(mod))

    if (keys) return recursiveSearch
    return recursiveSearch.map(key => {
      const [name, version] = key.split('@')
      return modsClone.find(x => x.name === name && x.version === version)
    })
  }

  /**
   * @param {string[]} linksToSearch Array of links
   * @param {any[]} mods Array of Mods
   * @param {('dependencies'|'conflicts')} type Type
   * @param {string[]} li Checked
   * @param {string[]} ch Checked
   * @returns {string[]}
   */
  findLinksR (linksToSearch, mods, type, li, ch) {
    const links = !li ? [] : [...li]
    const checked = !ch ? [] : [...ch]

    for (const link of linksToSearch) {
      const [name, range] = link.split('@')
      const search = mods.find(x => x.name === name && semver.satisfies(x.version, range))

      // Not satisfied
      if (!search && type === 'dependencies') throw new Error('Dependency not satisfied')

      // Push link
      const key = this.modKey(search)
      if (!links.includes(key)) {
        links.push(key)
        checked.push(link)
      }

      // Conflicts only need to check 1 level deep
      if (type === 'conflicts') continue

      const nestedLinks = search.links.dependencies.filter(x => !checked.includes(x))

      // Process nested links
      if (nestedLinks.length > 0) {
        const nested = this.findLinksR(nestedLinks, mods, type, links, checked)

        for (const n of nested) {
          if (!links.includes(n)) links.push(n)
        }
      }
    }

    return links
  }

  installMods () {
    const mods = [...this.state.filteredMods]
    const toInstall = mods.filter(mod => mod.install.selected || mod.install.requiredBy.length > 0 || false)
    console.log(toInstall.map(mod => `${mod.name}@${mod.version} // ${mod.details.author.name}`))
  }

  render () {
    return (
      <Provider value={{
        statusText: this.state.statusText,
        install: this.state.install,
        status: this.state.status,

        setStatusText: statusText => this.setState({ statusText }),

        mods: this.state.mods,
        gameVersions: this.state.gameVersions,
        filteredMods: this.state.filteredMods,
        toggleMod: index => { this.toggleMod(index) },
        installMods: () => { this.installMods() },

        selected: this.state.selected,
        setSelected: selected => this.setState({ selected }),
      }}>
        { this.props.children }
      </Provider>
    )
  }
}

export const Controller = Consumer
export default Context
