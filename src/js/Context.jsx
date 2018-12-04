import React, { Component } from 'react'
import semver from 'semver'
import PropTypes from 'prop-types'

import * as c from './constants.js'

/**
 * @type {Electron}
 */
const electron = window.require('electron')
const { ipcRenderer } = electron
const { dialog, getCurrentWindow } = electron.remote

const Store = window.require('electron-store')
const store = new Store()

const Context = React.createContext()
const { Provider, Consumer } = Context

export class ControllerProvider extends Component {
  constructor (props) {
    super(props)

    this.state = {
      theme: store.get('theme') || 'light',

      statusText: c.STATUS_TEXT_IDLE,
      install: { path: null, platform: 'unknown' },
      status: c.STATUS_LOADING,

      rawMods: [],
      gameVersions: [],
      mods: [],

      currentPage: 0,
      maxPages: null,
      selected: null,
    }

    ipcRenderer.on('set-status', (_, { text, status }) => {
      if (text) this.setState({ statusText: text })
      if (status) this.setState({ status })
    })

    ipcRenderer.on('set-path', (_, install) => this.setState({ install }))
    ipcRenderer.on('set-remote', (_, { status, mods, gameVersions }) => {
      if (status === 'error') return this.setState({ statusText: c.STATUS_TEXT_OFFLINE, status: c.STATUS_OFFLINE })

      const gvIdx = gameVersions.findIndex(x => x.selected)

      this.setState({
        statusText: c.STATUS_TEXT_LOADED,
        status: c.STATUS_LOADED,
        rawMods: mods,
        gameVersions,
      }, () => { this.filterMods(gvIdx) })
    })
  }

  static propTypes = {
    children: PropTypes.node.isRequired,
  }

  componentDidMount () {
    ipcRenderer.send('get-path')
    ipcRenderer.send('get-remote')

    this.setState({ statusText: c.STATUS_TEXT_LOADING })
    this.setTheme(this.state.theme)
  }

  setStateAsync (state) {
    return new Promise(resolve => {
      this.setState(state, () => { resolve() })
    })
  }

  setTheme (theme) {
    const [html] = document.getElementsByTagName('html')

    if (theme === 'dark') html.classList.add('dark')
    else html.classList.remove('dark')

    store.set('theme', theme)
    this.setState({ theme })
  }

  async filterMods (index = 0) {
    const { rawMods, gameVersions } = this.state
    const gameVersion = gameVersions[index] || {}

    const mods = rawMods
      .filter(mod => mod !== null)
      .filter(mod => mod.gameVersion.manifest === gameVersion.manifest)
      .map(mod => {
        mod.meta.category = mod.meta.category || c.CATEGORY_DEFAULT
        return mod
      })
      .map(mod => {
        mod.install = {
          selected: false,
          requiredBy: c.MODS_REQUIRED.includes(mod.name) ? ['global'] : [],
          conflictsWith: [],
        }

        return mod
      })

    await this.setStateAsync({ mods, selected: null })

    const defaultMods = this.state.mods
      .filter(x => c.MODS_DEFAULT.includes(x.name))
      .map(x => this.state.mods.findIndex(mod => mod.name === x.name && mod.version === x.version))

    for (const idx of defaultMods) {
      await this.toggleMod(idx) // eslint-disable-line
    }
  }

  toggleMod (index) {
    // Deep clone
    const mods = JSON.parse(JSON.stringify(this.state.mods))
    const mod = mods[index]

    const locked = mod.install.requiredBy.length > 0 || mod.install.conflictsWith.length > 0
    if (locked) return undefined

    mod.install.selected = !mod.install.selected

    if (mod.install.selected) return this.checkMod(mod, mods)
    else return this.uncheckMod(mod, mods)
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

      return dialog.showMessageBox(getCurrentWindow(), {
        title: 'Conflicting Mod',
        type: 'error',
        message:
          `This mod conflicts with ${conflict.details.title} v${conflict.version}\n\n` +
          `Uncheck it and try again!`,
      })
    }

    return this.setStateAsync({ mods })
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

    return this.setStateAsync({ mods })
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
    const mods = [...this.state.mods]
    const toInstall = mods.filter(mod => mod.install.selected || mod.install.requiredBy.length > 0 || false)
    ipcRenderer.send('install-mods', { mods: toInstall, install: this.state.install })
  }

  render () {
    return (
      <Provider value={{
        theme: this.state.theme,
        setTheme: theme => this.setTheme(theme),

        status: this.state.status,
        statusText: this.state.statusText,
        install: this.state.install,

        setStatus: status => this.setState({ status }),
        setStatusText: statusText => this.setState({ statusText }),

        rawMods: this.state.rawMods,
        gameVersions: this.state.gameVersions,
        mods: this.state.mods,
        toggleMod: index => { this.toggleMod(index) },
        installMods: () => { this.installMods() },
        filterMods: gvIdx => { this.filterMods(gvIdx) },

        selected: this.state.selected,
        setSelected: selected => this.setState({ selected }),

        currentPage: this.state.currentPage,
        setCurrentPage: currentPage => this.setState({ currentPage }),

        maxPages: this.state.maxPages,
        setMaxPages: maxPages => this.setState({ maxPages }),
      }}>
        { this.props.children }
      </Provider>
    )
  }
}

export const Controller = Consumer
export default Context
