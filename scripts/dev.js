const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// File and directory paths
const baseFile = path.join(__dirname, '..', '/themes/midnight-refresh.theme.css');
const buildFile = path.join(__dirname, '..', '/build/midnight-compiled.css');
const srcDir = path.join(__dirname, '..', '/src');
const outputPaths = process.env.DEV_OUTPUT_PATH ? process.env.DEV_OUTPUT_PATH.split(',') : [];

// Ensure output paths are set
if (outputPaths.length === 0) {
	console.error('DEV_OUTPUT_PATH is not set in .env file');
	process.exit(1);
}

// Combine all CSS files from the source directory
function combineSourceFiles() {
	let combinedCSS = '';

	const files = fs
		.readdirSync(srcDir)
		.filter((file) => file.endsWith('.css'))
		.map((file) => path.join(srcDir, file));

	files.forEach((file) => {
		const content = fs.readFileSync(file, 'utf8');
		combinedCSS += `/* ${path.basename(file)} */\n${content}\n`;
	});

	fs.writeFileSync(buildFile, combinedCSS);
	return combinedCSS;
}

// Process the base file and replace imports with actual content
function processBaseFile(compiledCSS) {
	const baseContent = fs.readFileSync(baseFile, 'utf8');
	const importRegex = /@import\s+url\(['"]?[^'"]+['"]?\);/g;

	const processedContent = baseContent.replace(importRegex, compiledCSS);

	outputPaths.forEach((outputPath) => {
		fs.writeFileSync(outputPath, processedContent);
		console.log(`Updated ${outputPath}`);
	});
}

/**
 * Main processing function
 */
function processFiles() {
	try {
		const compiledCSS = combineSourceFiles();
		processBaseFile(compiledCSS);
	} catch (error) {
		console.error('Error processing files:', error);
	}
}

processFiles();

// Set up watchers
const watcher = chokidar.watch([baseFile, `${srcDir}/**/*.css`], {
	ignoreInitial: true,
});

// Watch for changes
watcher
	.on('change', (filePath) => {
		console.log(`File changed: ${filePath}`);
		processFiles();
	})
	.on('add', (filePath) => {
		console.log(`New file added: ${filePath}`);
		processFiles();
	})
	.on('unlink', (filePath) => {
		console.log(`File deleted: ${filePath}`);
		processFiles();
	})
	.on('error', (error) => console.error(`Watcher error: ${error}`));
