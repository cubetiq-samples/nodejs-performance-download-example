const express = require('express');
const { downloadFileFromURLAsStreamV1, downloadFileFromURLAsStreamV2, createHash, downloadFromURLAsBuffer, createCancelToken } = require('./download');
const fs = require('fs');
const path = require('path');

const app = express();

app.get('/', (req, res) => {
    res.json({
        message: 'Hello World'
    });
});

const downloadFromPath = (req, res, outputPath, filename) => {
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.download(outputPath);
}

app.get('/download', async (req, res) => {
    // create a cancel token
    const cancelSource = createCancelToken();

    // Check request is cancelled
    req.on('close', () => {
        console.log('Request cancelled by client');
        cancelSource.cancel('Operation cancelled by client');
    });

    const version = parseInt(req.query.v || '1');
    const url = req.query.url;

    if (!url) {
        res.status(400).json({
            message: 'URL is required'
        });
        return;
    }

    const filenameFromURL = url.split('/').pop();
    const filename = req.query.filename || filenameFromURL || 'unknown.download';

    if (version === -1) {
        const buffer = await downloadFromURLAsBuffer(url, cancelSource);
        if (!buffer) {
            res.status(500).json({
                message: 'Download failed'
            });
            return;
        }

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(buffer);
        return;
    }

    const hashFilename = createHash(`${url}-${filename}`);
    const fileExtension = path.extname(filename);

    const outputPath = `./downloads/${hashFilename}${fileExtension}`;

    // if (fs.existsSync(outputPath)) {
    //     console.log('File already downloaded located at: ', outputPath);
    //     downloadFromPath(req, res, outputPath, filename)
    //     return;
    // }

    const parentPath = path.dirname(outputPath);
    if (!fs.existsSync(parentPath)) {
        fs.mkdirSync(parentPath, { recursive: true });
    }

    const downloader = version === 1 ? downloadFileFromURLAsStreamV1 : downloadFileFromURLAsStreamV2

    await downloader(url, outputPath, cancelSource)
        .then(() => {
            downloadFromPath(req, res, outputPath, filename)
        })
        .catch((err) => {
            res.status(500).json({
                message: err.message || 'Something went wrong'
            });
        });
});

app.get('/downloaded', (req, res) => {
    if (!fs.existsSync('./downloads')) {
        res.json({
            files: []
        });
        return;
    }

    const files = fs.readdirSync('./downloads');
    const filesWithStats = files.map((file) => {
        const stats = fs.statSync(`./downloads/${file}`);
        return {
            file: file,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
        }
    });

    res.json({
        files: filesWithStats
    });
});

module.exports = app;