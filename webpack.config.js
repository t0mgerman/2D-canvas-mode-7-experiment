var webpack = require('webpack');
var path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackShellPlugin = require('webpack-shell-plugin');

module.exports = (env, argv) => {
    const isDev = argv.mode === 'development';
    let webpackPlugins = [
        new WebpackShellPlugin({
            onBuildStart: ["npm run build:style-typings"],
            dev: false,
        }),
        new webpack.WatchIgnorePlugin([/scss\.d\.ts$/])
    ];
    if (isDev) {
        webpackPlugins.push(
            new HtmlWebpackPlugin({
                chunks: ['vendor', 'mode7'],
                hash: true,
                filename: 'index_dev.html',
                template: 'src/index_dev.html',
            })
        );
    } else {
        webpackPlugins.push(
            new HtmlWebpackPlugin({
                chunks: ['vendor', 'mode7'],
                hash: true,
                filename: 'index.html',
                template: 'src/index.html'
            })
        );
    }
    return ({
        // Change to your "entry-point".
        mode: isDev ? 'development' : 'production',
        entry: {
            mode7: './src/index',
        },
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: '[name].js',
            publicPath: 'http://localhost:3000/dist/',
            // publicPath: isDev ? 'http://localhost:3000/dist/' : '/path/to/live',
        },
        optimization: {
            splitChunks: {
                cacheGroups: {
                    vendor: {
                        test: /node_modules/,
                        chunks: 'initial',
                        name: 'vendor',
                        enforce: true,
                    },
                },
                chunks: 'async',
                automaticNameDelimiter: '.',
            }
        },
        devServer: {
            disableHostCheck: true,
            writeToDisk: true,
            contentBase: './',
            publicPath:'/dist',
            port: 3000,
            openPage: 'dist/index_dev.html',
            // headers: {
            //     "Access-Control-Allow-Origin": "*",
            //     "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            //     "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
            // }
        },
        devtool: isDev ? 'source-map' : false,
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.json', '.css', '.scss']
        },
        module: {
            rules: [{
                // ts, tsx, js, and jsx files.
                test: /\.(ts|js)x?$/,
                exclude: /node_modules/,
                loader: "babel-loader"
            },{
                test: /\.s?(a|c)?ss$/,
                use: [
                    "style-loader",
                    // "@teamsupercell/typings-for-css-modules-loader",
                    { 
                        loader: "css-loader",
                        options: { 
                            modules: {
                                localIdentName: "[local]_[hash:base64:5]"
                            }
                        }
                    },
                    "sass-loader"
                ]
            },{
                test: /\.(png|jpe?g|gif|eot|svg|woff|ttf)$/,
                loader: 'file-loader',
                options: {
                    name: '/assets/[name].[ext]',
                    publicPath: function(url) {
                        return url.replace(/assets/, 
                            '/localhost:3000/dist/assets'
                            // isDev ? '/localhost:3000/dist/assets' : '/path/to/live/assets'
                        );
                    }
                }
            }, {
                test: /\.html$/,
                loader: 'html-loader'
            }],
        },
        plugins: webpackPlugins
    });
}