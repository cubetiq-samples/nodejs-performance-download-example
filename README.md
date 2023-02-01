# Nodejs Download File from URL with Performance

-   [x] Download Function 1 (Legacy) (v=1)
-   [x] Download Function 2 (Modern) (v=2)
-   [x] Download Function with Buffer (Slow/Leak memory) (v=-1)

### Usage

-   Clone the repository

```shell
git clone https://github.com/cubetiq-samples/nodejs-performance-download-example.git
cd nodejs-performance-download-example
```

-   Install dependencies

```
npm install
```

-   Start

```shell
npm run start
```

### Run with Docker

```shell
make
```

### Testing to API

```shell
curl http://localhost:3000/download?url=http://download.ctdn.net/test/1G.img&v=-1
```

### Contributors

-   Sambo Chea <sombochea@cubetiqs.com>
