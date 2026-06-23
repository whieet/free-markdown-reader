// Type shims for markdown-it plugins that ship no bundled .d.ts.
declare module 'markdown-it-abbr' {
  import type { PluginSimple } from 'markdown-it'
  const plugin: PluginSimple
  export default plugin
}
declare module 'markdown-it-deflist' {
  import type { PluginSimple } from 'markdown-it'
  const plugin: PluginSimple
  export default plugin
}
declare module 'markdown-it-ins' {
  import type { PluginSimple } from 'markdown-it'
  const plugin: PluginSimple
  export default plugin
}
declare module 'markdown-it-mark' {
  import type { PluginSimple } from 'markdown-it'
  const plugin: PluginSimple
  export default plugin
}
declare module 'markdown-it-sub' {
  import type { PluginSimple } from 'markdown-it'
  const plugin: PluginSimple
  export default plugin
}
declare module 'markdown-it-sup' {
  import type { PluginSimple } from 'markdown-it'
  const plugin: PluginSimple
  export default plugin
}
declare module 'markdown-it-task-lists' {
  import type { PluginWithOptions } from 'markdown-it'
  const plugin: PluginWithOptions<{
    enabled?: boolean
    label?: boolean
    labelAfter?: boolean
  }>
  export default plugin
}
declare module 'markdown-it-multimd-table' {
  import type { PluginWithOptions } from 'markdown-it'
  const plugin: PluginWithOptions<Record<string, boolean>>
  export default plugin
}
declare module 'markdown-it-table-of-contents' {
  import type { PluginWithOptions } from 'markdown-it'
  const plugin: PluginWithOptions<Record<string, unknown>>
  export default plugin
}
