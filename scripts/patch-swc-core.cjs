// إصلاح لمنصات مش مدعومة (زي Termux/Android) حيث @swc/core
// مفيهوش binary أصلي ولا نسخة WASM متاحة. next-intl بيستخدم
// @swc/core بس لميزة اختيارية اسمها "extract" إحنا مش مستخدمينها،
// فتحويل الخطأ لـ "كسول" (يظهر بس لو حد فعلاً نادى عليه) آمن هنا.
const fs = require('fs')
const path = require('path')

const bindingPath = path.join(__dirname, '..', 'node_modules', '@swc', 'core', 'binding.js')
if (!fs.existsSync(bindingPath)) process.exit(0)

const original = `if (!nativeBinding) {
  if (loadErrors.length > 0) {
    // TODO Link to documentation with potential fixes
    //  - The package owner could build/publish bindings for this arch
    //  - The user may need to bundle the correct files
    //  - The user may need to re-install node_modules to get new packages
    throw new Error('Failed to load native binding', { cause: loadErrors })
  }
  throw new Error(\`Failed to load native binding\`)
}`

const patched = `if (!nativeBinding) {
  nativeBinding = new Proxy({}, {
    get() {
      return function unavailableSwcBinding() {
        throw new Error('@swc/core native binding unavailable on this platform (unused feature).')
      }
    }
  })
}`

const content = fs.readFileSync(bindingPath, 'utf8')
if (content.includes(original)) {
  fs.writeFileSync(bindingPath, content.replace(original, patched))
  console.log('[patch-swc-core] Patched successfully.')
} else {
  console.log('[patch-swc-core] Already patched or different version, skipping.')
}
