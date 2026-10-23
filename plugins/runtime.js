// What the app takes from Faust to play a compiled plugin. Bundled by scripts/build-plugins.mjs
// into public/plugins/faust.js, unminified: Faust writes the code its audio thread runs out of
// its own classes, as text, and a minifier's short names would not be there to find.
import { FaustMonoDspGenerator } from '@grame/faustwasm/dist/src/FaustDspGenerator.js'

// Faust notes what it has put on each audio clock in a plain Map, which keeps every clock it ever
// played on, a song made into a file included, and all that clock holds, for as long as the app
// runs. Kept weakly, a clock goes when nothing else holds it.
FaustMonoDspGenerator.gWorkletProcessors = new WeakMap()

export { FaustMonoDspGenerator }
