/** @type {import('@babel/core').ConfigFunction} */
module.exports = function (api) {
  api.cache(true)
  
  return {
    presets: ['next/babel'],
    // Disable styled-jsx plugin if causing issues
    plugins: [],
  }
}
