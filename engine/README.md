#  engine/

contains code for the engine, which is used both in the editor for previewing, and packaged with the game data during export.

the engine is compiled separately into its own file first, and then imported into either the editor or the exported game.

* See `scripts/build_engine.ts` for the code involved in compiling the engine
* The compiled engine will be stored in `_compiled/Engine.js`

**entry point:** `Engine.ts`