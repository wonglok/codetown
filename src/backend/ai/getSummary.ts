import fs from 'fs/promises'
import path from 'path'
/**
 * Recursively reads folder and extracts lines with "//SUMMARY:"
 */
async function extractSummaryComments(rootDir) {
  const results = []

  async function scanDirectory(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)

        if (fullPath.includes('node_modules')) {
          continue
        }
        if (fullPath.includes('.next')) {
          continue
        }
        if (fullPath.includes('venv')) {
          continue
        }
        if (fullPath.includes('__pycache__')) {
          continue
        }

        if (entry.isDirectory()) {
          await scanDirectory(fullPath) // Recurse into subdirectories
          results.push({
            file: path.relative(rootDir, fullPath),
            content: ''
          })
        } else if (entry.isFile()) {
          // && isSupportedExtension(entry.name)
          await extractFromFile(fullPath, results)
        }
      }
    } catch (err) {
      console.error(`Error reading directory ${dirPath}:`, err)
    }
  }

  function isSupportedExtension(filename) {
    const ext = path.extname(filename).toLowerCase()
    return ['.js', '.ts', '.jsx', '.tsx', '.json', '.md'].includes(ext)
  }

  async function extractFromFile(filePath, results) {
    try {
      const content = await fs.readFile(filePath, 'utf-8')

      results.push({
        file: path.relative(rootDir, filePath),
        content: content
      })
    } catch (err) {
      console.error(`Error reading file ${filePath}:`, err)
    }
  }

  await scanDirectory(rootDir)
  return results
}

export const scanFolder = async (targetFolder) => {
  return await extractSummaryComments(targetFolder)
    .then((results) => {
      const csv = `File\n${results.map((r: any) => `${JSON.stringify(r.file)}`).join('\n')}`

      if (results.length === 0) {
        return ''
      }

      return `
## Files in the project folder:
${csv}`
    })
    .catch((err) => {
      console.error('Script error:', err.message)
      return ''
    })
}
