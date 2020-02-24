const express = require('express');
const cors = require('cors');

const app = express();

const fs = require('fs');
const https = require('https');
const privateKey = fs.readFileSync('cert/key.pem', 'utf8');
const certificate = fs.readFileSync('cert/hypertube.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };
const server = https.createServer(credentials, app);

const TorrentService = require('./src');

// const API_IP = 'localhost';
// const TORRENT_PORT = 8444;
const STREAM_PORT = 8445;
// const API_PORT = 8446;
// const SOCKET_PORT = 8447;

app.use(cors());

app.get('/stream', (req, res) => {
    res.json('Stream server is running');
});

const client = new TorrentService();

client.on('error', err => {
    console.log(err.message);
});

const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath('./resources/ffmpeg');

app.get('/stream/add/:magnet', (req, res) => {
    const magnet = req.params.magnet;

    const tor = client.get(magnet);

    if (tor != null) {
        let max = {
            filename: '',
            dirname: '',
            length: 0
        };

        for (i = 0; i < tor.files.length; i++) {
            if (max.length < tor.files[i].length)
                max = {
                    filename: tor.files[i].name,
                    dirname: tor.name,
                    length: tor.files[i].length
                };
        }

        res.json(max);
    } else {
        client.add(magnet, torrent => {
            let max = {
                filename: '',
                dirname: '',
                length: 0
            };

            torrent.files.forEach(data => {
                if (max.length < data.length)
                    max = {
                        filename: data.name,
                        dirname: torrent.name,
                        length: data.length
                    };
            });

            if (max.filename.match('.mkv')) {
                const input = `/tmp/webtorrent/${magnet}/${max.dirname}/${max.filename}`;
                const output = `/tmp/webtorrent/${magnet}/${max.dirname}/${max.filename.replace('.mkv', '.mp4')}`;

                new ffmpeg()
                    .input(input)
                    .output(output)
                    .videoCodec('libx264')
                    .audioCodec('aac')
                    .addOption(['-threads 1', '-crf 22', '-preset ultrafast', '-tune zerolatency', '-movflags frag_keyframe+empty_moov+faststart', '-f ismv'])
                    .format('mp4')
                    .on('start', function(commandLine) {
                        console.log('Transcoding started.');
                        console.log(commandLine);
                    })
                    .on('progress', progress => {
                        // console.log(progress);
                    })
                    .on('error', e => {
                        console.log('Transcoding error.', e);
                    })
                    /*.on('stderr', (stderrLine) => {
                        stderrLines.push(stderrLine);
                      })*/
                    .on('end', () => {
                        console.log('Transcoding ended.');
                    })
                    .run();
            }
            res.json(max);
        });
    }
});

app.get('/stream/normal/:magnet/:filename', (req, res, next) => {
    const magnet = req.params.magnet;
    const filename = req.params.filename;

    const tor = client.get(magnet);

    let file = {};

    for (i = 0; i < tor.files.length; i++) {
        if (tor.files[i].name == filename) {
            file = tor.files[i];
        }
    }

    const range = req.headers.range;

    if (!range) {
        let err = new Error('Wrong range');
        err.status = 416;
        return next(err);
    }

    const file_size = file.length;
    const positions = range.replace(/bytes=/, '').split('-');
    const start = parseInt(positions[0], 10);
    const end = positions[1] ? parseInt(positions[1], 10) : file_size - 1;

    const chunksize = end - start + 1;

    res.writeHead(206, {
        'Content-Range': 'bytes ' + start + '-' + end + '/' + file_size,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4'
    });

    let stream = file.createReadStream({
        start,
        end
    });

    stream.pipe(res);

    stream.on('error', err => {
        return next(err);
    });
});

app.get('/stream/mkv/:magnet/:dirname/:filename', (req, res, next) => {
    const magnet = req.params.magnet;
    const dirname = req.params.dirname;
    const filename = req.params.filename;

    const path = `/tmp/webtorrent/${magnet}/${dirname}/${filename}`;
    let stat = fs.statSync(path);
    let fileSize = stat.size;
    const range = req.headers.range;

    console.log(fileSize);

    if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        res.writeHead(206, {
            'Content-Range': 'bytes ' + start + '-' + end + '/' + fileSize,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': 'video/mp4',
            'Cache-Control': 'must-revalidate',
        });

        let stream = fs.createReadStream(path, {
            start,
            end
        });

        stream.pipe(res);

        stream.on('error', err => {
            return next(err);
        });
    } else {
        res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4'
        });

        let stream = fs.createReadStream(path);

        stream.pipe(res);
    }
});

server.listen(STREAM_PORT, () => {
    console.log(`Stream server is running on port ${STREAM_PORT}`);
});
