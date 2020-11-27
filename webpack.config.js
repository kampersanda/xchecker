const main = {
    mode: 'development',
    entry: './src/main.ts',
    output: {
        path: __dirname,
        filename: './dist/main.js'
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
