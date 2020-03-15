/**
 * @fileoverview the plugin for less to support custom aliase
 * @author houquan | 870301137@qq.com
 * @version 1.0.0 | 2020-03-15 | houquan      // initial version
 */

import path from 'path'
import fs from 'fs'

interface Options {
  prefix?: string
  aliases: Record<string, string | string[]>
}

export default class LessAliasesPlugin {
  constructor(private options: Options) {}

  install (less: LessStatic, pluginManager: Less.PluginManager) {
    const { prefix = '~', aliases } = this.options

    function resolve (filename: string) {
      if (filename.startsWith(prefix)) {
        const chunks = filename.split('/')
        const aliaseKey = chunks[0].slice(1)
        const restPath = chunks.slice(1).join('/')
        const resolvedAliase = aliases[aliaseKey]

        let resolvedPath: string | undefined
        if (Array.isArray(resolvedAliase)) {
          resolvedPath = resolvedAliase.find((p) => fs.existsSync(path.join(p, restPath)))
        } else {
          resolvedPath = fs.existsSync(path.join(resolvedAliase, restPath)) ? resolvedAliase : undefined
        }
        if (!resolvedPath) {
          throw new Error(`Invalid aliase config for key: ${aliaseKey}`)
        }
        return path.join(resolvedPath, restPath)
      }

      return filename
    }

    class AliasePlugin extends less.FileManager {
      supports (filename: string, currentDirectory: string) {
        const aliaseNames = Object.keys(aliases)
        const len = aliaseNames.length

        for (let i = 0; i < len; i ++) {
          const key = `${prefix}${aliaseNames[i]}`
          if (filename.indexOf(key) !== -1 || currentDirectory.indexOf(key) !== -1) {
            return true
          }
        }
        return false
      }

      supportsSync (filename: string, currentDirectory: string) {
        return this.supports(filename, currentDirectory)
      }

      loadFile(filename: string, currentDirectory: string, options: Record<string, unknown>, enviroment: unknown, callback: Function) {
        return super.loadFile(resolve(filename), currentDirectory, options, enviroment, callback)
      }

      loadFileSync(filename: string, currentDirectory: string, options: Record<string, unknown>, enviroment: unknown, callback: Function) {
        return super.loadFileSync(resolve(filename), currentDirectory, options, enviroment, callback)
      }
    }

    pluginManager.addFileManager(new AliasePlugin())
  }
}
