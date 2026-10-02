#!/usr/bin/env bun
import { readFile, writeFile } from 'node:fs/promises'
import { dryRunImage } from '../src/lib/ai/runway'
import { generateImage, resultToBase64 } from '../src/lib/ai/provider'
import { processForLine } from '../src/lib/services/image-processing.service'

const input = {
  prompt:
    'A cheerful chibi sticker of the reference character waving, bold dark outline, white background.',
  referenceImage: (await readFile('public/stickers/chibi/01.png')).toString(
    'base64',
  ),
  referenceImageMimeType: 'image/png',
}
const routing = await dryRunImage(input)
console.log('Runway budget check:', routing)
if (process.argv.includes('--live')) {
  const started = Date.now()
  const result = await generateImage(input)
  const { data } = await resultToBase64(result)
  const image = await processForLine(Buffer.from(data, 'base64'))
  const output = '/tmp/ai-stickies-runway-smoke.png'
  await writeFile(output, image)
  console.log({
    model: result.model,
    credits: result.costCredits,
    elapsedSeconds: (Date.now() - started) / 1000,
    output,
  })
} else {
  console.log(
    'Dry run only. Add --live to generate one image for at most $0.04 including one confirmed-failure retry.',
  )
}
