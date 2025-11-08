const main = {
    mode: 'development',
    entry: './src/main.ts',
    output: {
        path: __dirname,
        filename: './app/main.js',
        hashFunction: 'xxhash64', // avoids OpenSSL md4 restrictions in Node 17+
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader'
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
}

module.exports = [main]
