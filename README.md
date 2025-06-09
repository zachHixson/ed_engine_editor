#  Ed Engine editor

This repo contains the Ed engine, as well as the editor

#  File Structure

* **engine/** - contains code for the engine, which is used both in the editor for previewing, and packaged with the game data during export
    * **core/** - contains code that is shared by both the engine and the editor. Stuff like rendering, common data structures, etc.
    * **text/** = code related to processing and rendering in-engine text. Only used during gameplay, and not by the editor
    * **transitions/** - code related to rendering transitions
    * **Engine.ts** - the main entry point into the engine's code
    * **Logic.ts & Node.ts** - contains code for processing logic scripts. Since no logic is actually "run," in the editor, and there's no graphical interface for nodes during actual gameplay, Logic and Node classes are entirely separate between the engine and the editor. They do however share their base data structure with the related editor classes.
* **scripts/** - contains utility scripts and scripts used during the build process
* **src/** - contains the main editor code. Entry points are **App.vue,** and **main.ts**
* **assets/** - contains all of the graphical assets used in the program
* **components/** - contains all of the sub components for the editor, and the bulk of the code. Entry points are **EditorWIndow.vue,** **TabPanel.vue,** and **HeaderPanel.vue**
    * **asset_browser/** - Asset browser component. Entry point is **AssetBrowser.vue**
    * **common/** - code and components that are shared between parts of the editor
    * **editor_art/** - code for the art (drawing) editor. Entry point is **ArtMain.vue**
    * **editor_logic/** - code for the logic editor. Entry point is **LogicMain.vue**
    * **editor_object/** - code for the object editor. Entry point is **ObjectMain.vue**
    * **editor_room/** - code for the room editor. Entry point is **RoomMain.vue**

# Build Modes

The editor has two build modes:

* build - builds the editor & engine to be hosted using a web server
* build-portable - builds the editor & engine in a single, self contained file that can be used completely offline with no internet connection

#  Project setup

This project uses few external libraries, so everything below is just the default setup for a standard Vite/Vue3 project

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
    1) Run `Extensions: Show Built-in Extensions` from VSCode's command palette
    2) Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```
