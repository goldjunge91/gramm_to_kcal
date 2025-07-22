/**
 * Script to generate test barcode images for integration testing
 *
 * This script creates sample barcode images that can be used to test
 * our BarcodeScanner component functionality.
 */

import fs from 'node:fs'
import path from 'node:path'

// Test barcode configurations
const TEST_BARCODES = [
  {
    code: '4007624017106',
    filename: 'ean13-sample.png',
    description: 'Basic EAN-13 test barcode',
  },
  {
    code: '40084963',
    filename: 'product-nutella.png',
    description: 'Nutella product barcode',
  },
  {
    code: '4000354007542',
    filename: 'coca-cola.png',
    description: 'Coca Cola product barcode',
  },
  {
    code: '99999999999', // Invalid barcode for error testing
    filename: 'invalid-barcode.png',
    description: 'Invalid barcode for error handling tests',
  },
]

/**
 * Generate a simple ASCII representation of an EAN-13 barcode
 * This is a simplified version for testing purposes
 */
function generateAsciiBarcode(code: string): string {
  // Simple pattern representation (not a real EAN-13 encoding)
  const patterns = {
    0: '||  | |',
    1: '| |  ||',
    2: '| || |',
    3: '|||| |',
    4: '|  |||',
    5: '|||  |',
    6: '| ||||',
    7: '||||  ',
    8: '  ||||',
    9: ' ||| |',
  }

  let barcode = '|||' // Start pattern

  for (const digit of code) {
    barcode += patterns[digit as keyof typeof patterns] || '| | ||'
  }

  barcode += '|||' // End pattern

  return barcode
}

/**
 * Create a simple SVG barcode for testing
 */
function generateSvgBarcode(
  code: string,
  width: number = 300,
  height: number = 100,
): string {
  const ascii = generateAsciiBarcode(code)
  const barWidth = width / ascii.length

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`
  svg += `<rect width="${width}" height="${height}" fill="white"/>`

  let x = 0
  for (const char of ascii) {
    if (char === '|') {
      svg += `<rect x="${x}" y="10" width="${barWidth}" height="${height - 20}" fill="black"/>`
    }
    x += barWidth
  }

  // Add the code text below
  svg += `<text x="${width / 2}" y="${height - 5}" text-anchor="middle" font-family="monospace" font-size="12">${code}</text>`
  svg += '</svg>'

  return svg
}

/**
 * Instructions for manual barcode creation
 */
function generateInstructions(): string {
  return `
# Test Barcode Creation Instructions

Since programmatic barcode generation is complex, here are instructions to create test barcodes manually:

## Option 1: Online Barcode Generators
1. Visit: https://barcode.tec-it.com/en
2. Select "EAN-13" format
3. Generate barcodes for:
   - 4007624017106 → save as ean13-sample.png
   - 40084963 → save as product-nutella.png  
   - 4000354007542 → save as coca-cola.png

## Option 2: Real Product Photos
1. Take clear photos of actual product barcodes
2. Ensure good lighting and focus
3. Crop to show just the barcode area
4. Save in tests/fixtures/barcodes/

## Option 3: Use Provided SVG
The script below generates simple SVG representations that can be converted to PNG:

${TEST_BARCODES.map(
  barcode => `
<!-- ${barcode.description} -->
${generateSvgBarcode(barcode.code)}
`,
).join('\n')}

## Requirements:
- Images should be at least 300x100 pixels
- High contrast (black bars on white background)
- PNG or JPEG format
- Clear, unobstructed barcode view

## File Structure:
tests/
└── fixtures/
    └── barcodes/
        ├── ean13-sample.png
        ├── product-nutella.png
        ├── coca-cola.png
        └── invalid-barcode.png (blurry/corrupted for error testing)
`
}

async function main() {
  const fixturesDir = path.join(__dirname, '../tests/fixtures/barcodes')

  // Ensure directory exists
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true })
  }

  // Generate instructions file
  const instructions = generateInstructions()
  fs.writeFileSync(path.join(fixturesDir, 'README.md'), instructions)

  // Generate simple SVG files for reference
  for (const barcode of TEST_BARCODES) {
    const svg = generateSvgBarcode(barcode.code)
    const svgPath = path.join(
      fixturesDir,
      barcode.filename.replace('.png', '.svg'),
    )
    fs.writeFileSync(svgPath, svg)
  }

  console.log('✅ Test barcode setup complete!')
  console.log('📁 Files created in:', fixturesDir)
  console.log(
    '📖 See README.md for instructions on creating proper barcode images',
  )
  console.log('🔧 SVG reference files generated - convert to PNG for testing')
}

if (require.main === module) {
  main().catch(console.error)
}

export { generateSvgBarcode, TEST_BARCODES }
