const axios = require('axios');
const fs = require('fs');
const { promisify } = require('util');

// const CancelToken = axios.CancelToken;
// const source = CancelToken.source();
// source.token
// When using
// cancel the request (the message parameter is optional)
// source.cancel('Operation canceled by the user.');

// For writter stream finished event
const streamFinished = promisify(require('stream').finished);

const prettyBytes = (num) => {
    if (isNaN(num)) {
        return '0 Bytes';
    }

    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const exponent = Math.min(Math.floor(Math.log(num) / Math.log(1000)), units.length - 1);
    const n = Number((num / Math.pow(1000, exponent)).toPrecision(3));
    const unit = units[exponent];
    return `${n} ${unit}`;
}

// Create an instance of axios
const axiosInstance = axios.create({
    // Set the responseType to stream
    responseType: 'stream',
    onDownloadProgress: (progressEvent) => {
        const { loaded, total } = progressEvent;
        const percent = Math.floor((loaded * 100) / total);
        console.log(`Downloaded ${prettyBytes(loaded)} of ${prettyBytes(total)} (${percent}%)`);
    },
    // Disable the max redirects to prevent the axios from following the redirect
    // And causing the download to store the cache in memory
    maxRedirects: 0,
});

const downloadFileFromURLAsStreamV1 = async (url, outputPath, cancelSource) => {
    console.log('[V1] Downloading file from: ', url);

    const writter = fs.createWriteStream(outputPath);

    // Make a GET request to the url
    return await axiosInstance.get(url, {
        cancelToken: cancelSource.token,
    })
        // When the response is received
        .then(response => {
            // Pipe the response stream to the file writter
            response.data.pipe(writter);

            // When the file is finished writing
            return new Promise((resolve, reject) => {
                let error = null;
                writter.on('error', (err) => {
                    error = err;
                    writter.close();
                    reject(error);
                });

                writter.on('close', () => {
                    if (!error) {
                        resolve(true);
                    }

                    // No need to call the reject here, as it will have been called in the
                    // 'error' stream;
                })
            });
        }).catch((err) => {
            console.log(`[V1] Error downloading file from ${url}`, err);
            throw err;
        }).finally(() => {
            writter.close();
            writter.destroy();
            console.log('[V1] File stream writter closed');
        });
}

const downloadFileFromURLAsStreamV2 = async (url, outputPath, cancelSource) => {
    console.log('[V2] Downloading file from: ', url);

    const writter = fs.createWriteStream(outputPath);

    // Make a GET request to the url
    return await axiosInstance.get(url, {
        cancelToken: cancelSource.token,
    })
        // When the response is received
        .then(response => {
            // Pipe the response stream to the file writter
            response.data.pipe(writter);
            return streamFinished(writter);
        }).catch((err) => {
            console.log(`[V2] Error downloading file from ${url}`, err);
            throw err;
        }).finally(() => {
            writter.close();
            writter.destroy();
            console.log('[V2] File stream writter closed');
        });
}

const createCancelToken = () => {
    const CancelToken = axios.CancelToken;
    return CancelToken.source();
}

const downloadFromURLAsBuffer = async (url, cancelSource) => {
    console.log('[Buffer] Downloading file from: ', url);
    try {
        // Make a GET request to the url
        return await axios.get(url, {
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Expires': 0,
            },
            responseType: 'arraybuffer',
            onDownloadProgress: (progressEvent) => {
                const { loaded, total } = progressEvent;
                const percent = Math.floor((loaded * 100) / total);
                console.log(`URL: ${url} | Downloaded ${loaded} of ${total} (${percent}%)`);
            },
            cancelToken: cancelSource.token,
            maxRedirects: 0,
        }).then(response => {
            if (response.status === 200) {
                return Buffer.from(response.data, 'binary');
            }

            throw new Error('Something went wrong');
        }).catch((err) => {
            if (axios.isCancel(err)) {
                console.log('Request canceled', err.message);
            } else {
                console.log(`Error downloading file from ${url}`, err);
            }

            throw err;
        });
    } catch (err) {
        console.log('Error downloading file from URL as buffer', err);
        return undefined;
    }
}

const generateRandomString = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

const createHash = (data) => {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
}

const deleteFile = (filePath) => {
    // Delete the file from the file system
    try {
        fs.unlinkSync(filePath);
    } catch (err) {
        console.log(`Error deleting file ${filePath}`, err);
    }
}

module.exports = {
    downloadFileFromURLAsStreamV1,
    downloadFileFromURLAsStreamV2,
    generateRandomString,
    createHash,
    downloadFromURLAsBuffer,
    createCancelToken,
    deleteFile,
}