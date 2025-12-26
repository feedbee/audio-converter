#!/usr/bin/env node

const { program } = require('commander');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

program
  .version('1.0.2')
  .description('CLI Audio Converter using FFmpeg')
  .argument('<files...>', 'Input audio file paths')
  .option('-o, --output <path>', 'Output file path (single file) or directory (multiple files)')
  .option('-f, --format <format>', 'Target format (mp3, wav, ogg, etc.)', 'mp3')
  .option('-b, --bitrate <bitrate>', 'Audio bitrate (e.g., 128k, 320k). If omitted, matches source.')
  .action(async (files, options) => {
      let outputIsDirectory = false;

      if (options.output) {
          if (fs.existsSync(options.output)) {
              if (fs.statSync(options.output).isDirectory()) {
                  outputIsDirectory = true;
              } else if (files.length > 1) {
                  console.error(`Error: Output path "${options.output}" is a file. When processing multiple files, output must be a directory.`);
                  process.exit(1);
              }
          } else if (files.length > 1) {
              console.error(`Error: Output directory "${options.output}" does not exist. Please create it first.`);
              process.exit(1);
          }
      }

      console.log(`Processing the following ${files.length} files:`);
      files.forEach(f => console.log(` - ${path.basename(f)}`));

      for (const file of files) {
          let destination = null;

          if (options.output) {
              if (outputIsDirectory) {
                  const parsedInput = path.parse(file);
                  destination = path.join(options.output, `${parsedInput.name}.${options.format}`);
              } else {
                  destination = options.output;
              }
          }

          await processFile(file, options, destination);
      }

      console.log('\nAll files have been processed');
  });

program.parse(process.argv);

/**
 * Process a single file
 */
async function processFile(inputFile, options, specificOutputPath) {
    if (!fs.existsSync(inputFile)) {
        console.error(`Error: Input file "${inputFile}" does not exist. Skipping.`);
        return;
    }

    console.log('');

    let outputFile = specificOutputPath;

    // Determine output filename if not provided
    if (!outputFile) {
        const parsedPath = path.parse(inputFile);
        outputFile = path.join(parsedPath.dir, `${parsedPath.name}.${options.format}`);
    }

    let targetBitrate = options.bitrate;

    // If bitrate not specified, try to detect it from source
    if (!targetBitrate) {
        try {
            const metadata = await new Promise((resolve, reject) => {
                ffmpeg.ffprobe(inputFile, (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                });
            });
            
            if (metadata.format && metadata.format.bit_rate) {
                targetBitrate = Math.floor(metadata.format.bit_rate / 1000) + 'k';
            }
        } catch (err) {
            console.warn(`[${path.basename(inputFile)}] Warning: Could not detect source bitrate. Defaulting to encoder settings.`);
        }
    }

    console.log(`Processing: ${path.basename(inputFile)}`);
    console.log(`Target:     ${path.basename(outputFile)}`);
    console.log(`Bitrate:    ${targetBitrate || 'auto'}`);

    const command = ffmpeg(inputFile);

    if (targetBitrate) {
        command.audioBitrate(targetBitrate);
    }

    return new Promise((resolve) => {
        command
            .toFormat(options.format)
            .on('error', (err) => {
                console.error(`Failed to convert ${inputFile}: ${err.message}`);
                resolve(); // Resolve anyway to continue with next file
            })
            .on('progress', (progress) => {
                if (progress.percent) {
                    process.stdout.write(`  ${Math.floor(progress.percent)}% done\r`);
                }
            })
            .on('end', () => {
                process.stdout.write('  Done!       \n');
                resolve();
            })
            .save(outputFile);
    });
}