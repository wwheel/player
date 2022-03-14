const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const semver = require('semver');
const cheerio = require('cheerio');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

// Loading the current package.json - will be used to determine version etc.
const packageJSON = require(path.resolve(__dirname, 'package.json'));

// Validate package version is valid semver
if (!semver.valid(packageJSON.version)) {
    throw 'Invalid package version - ' + packageJSON.version;
}

// Distribution options configure how build paths are going to be configured.
const getDistOptions = (mode) => {
    const fullVersion = packageJSON.version;
    const majorVersion = semver.major(packageJSON.version);

    switch (mode) {
        case 'development':
            return {
                path: path.resolve(__dirname, 'dist'),
                publicPath: `auto`
            };
        case 'current':
            return {
                path: path.resolve(__dirname, 'dist-cdn/v' + majorVersion + '/current/'),
                publicPath: '/'
            };
        case 'versioned':
            return {
                path: path.resolve(__dirname, 'dist-cdn/' + fullVersion + '/'),
                publicPath: '/'
            };
        default:
            throw 'Unknown distribution type provided in --dist!';
    }
};

// Webpack configuration
module.exports = (env, argv) => {
    const wpMode = typeof argv.mode !== 'undefined' ? argv.mode : 'development';
    const wpDebug = wpMode === 'development' && typeof argv.debug !== 'undefined' && !!argv.debug;
    const wpDist = typeof argv.dist !== 'undefined' ? argv.dist : 'development';
    const wpDistOptions = getDistOptions(wpDist);

    if ('development' !== wpDist && (wpMode !== 'production' || wpDebug)) {
        throw 'Building a production distribution in development mode or with debug enabled is not allowed!'
    }

    const plugins = [
        // Define common variables for use in Fluid Player
        new webpack.DefinePlugin({
            WWP_BUILD_VERSION: JSON.stringify(packageJSON.version),
            WWP_HOMEPAGE: JSON.stringify(packageJSON.homepage),
            WWP_ENV: JSON.stringify(wpMode),
            WWP_DEBUG: JSON.stringify(wpDebug),
            WWP_WITH_CSS: false
        })
    ];

    // Development mode builds and development server specifics
    if ('development' === wpMode) {
        // Locate all E2E cases
        const caseFiles = [];
        fs.readdirSync(path.resolve(__dirname, 'test/html/')).forEach(file => {
            const absPath = path.resolve(__dirname, 'test/html/', file);
            const caseHtml = cheerio.load(fs.readFileSync(absPath));
            const publicName = file.replace('.tpl', '');

            plugins.push(new HtmlWebpackPlugin({
                template: path.resolve(__dirname, 'test/html/', file),
                inject: false,
                filename: publicName
            }));

            caseFiles.push({
                file: publicName,
                name: caseHtml('title').text()
            });
        });

        // Emit all cases as separate HTML pages
        plugins.push(new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'test/index.html'),
            filename: 'index.html',
            inject: false,
            templateParameters: {
                cases: caseFiles
            }
        }));

        // Copy static assets for E2E
        plugins.push(new CopyPlugin(
            [
                {from: path.resolve(__dirname, 'test/static/'), to: path.resolve(wpDistOptions.path, 'static')}
            ]
        ));
    }

    console.log('wpDistOptions-', wpDistOptions);

    return {
        devServer: {
            contentBase: wpDistOptions.path,
            index: 'index.html',
            watchContentBase: true
        },
        devtool: wpMode === 'development' ? 'source-map' : false,
        plugins,
        entry: {
            wwplayer: './src/browser.ts'
        },
        optimization: {
            minimize: wpMode !== 'development'
        },
        resolve: {
            // Add `.ts` and `.tsx` as a resolvable extension.
            extensions: [".ts", ".tsx", ".js"]
        },
        output: {
            filename: '[name].min.js',
            chunkFilename: '[name].[chunkhash].min.js',
            path: wpDistOptions.path,
            publicPath: wpDistOptions.publicPath
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    loader: 'ts-loader',
                },
                {
                    test: /\.m?js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env']
                        }
                    }
                },
                {
                    test: /\.css$/i,
                    use: ['style-loader', 'css-loader'],
                },
                {
                    test: /\.svg$/,
                    loader: 'svg-url-loader'
                }
            ],
        }
    };
};

